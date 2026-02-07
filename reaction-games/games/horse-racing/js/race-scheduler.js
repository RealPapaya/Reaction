// ====================================
// Race Scheduler (修正版 - 確保歷史記錄生成)
// ====================================

class RaceScheduler {
    constructor() {
        this.raceInterval = 8.5 * 60 * 1000;
        this.bettingDuration = 5 * 60 * 1000;
        this.preRaceDuration = 15 * 1000;
        this.raceDuration = 2.5 * 60 * 1000;
        this.postRaceDuration = 15 * 1000;
        this.closedDuration = 75 * 1000;

        this.raceSeeds = {};
        this.loadRaceSeeds();

        this.raceHistory = {};
        this.loadRaceHistory();

        this.replayData = {};
        this.loadReplayData();

        this.schedule = null;
        this.loadOrInitializeSchedule();

        // **新增：清理損壞的歷史記錄**
        this.cleanupCorruptedHistory();
    }

    // ====================================
    // **新增：清理損壞的歷史記錄**
    // ====================================
    cleanupCorruptedHistory() {
        let cleaned = false;
        Object.keys(this.raceHistory).forEach(key => {
            const results = this.raceHistory[key];
            // 如果是空陣列或無效數據，刪除它
            if (!results || (Array.isArray(results) && results.length === 0)) {
                console.warn(`🗑️ 清理損壞的歷史記錄: ${key}`);
                delete this.raceHistory[key];
                cleaned = true;
            }
        });
        if (cleaned) {
            this.saveRaceHistory();
            console.log('✅ 已清理損壞的歷史記錄');
        }
    }

    loadOrInitializeSchedule() {
        const saved = localStorage.getItem('raceSchedule');

        if (saved) {
            try {
                this.schedule = JSON.parse(saved);
                console.log('📅 已載入賽程排程');
            } catch (e) {
                console.error('排程載入失敗，重新初始化', e);
                this.schedule = this.generateInitialSchedule();
                this.saveSchedule();
            }
        } else {
            console.log('📅 初始化新賽程排程');
            this.schedule = this.generateInitialSchedule();
            this.saveSchedule();
        }
    }

    generateInitialSchedule() {
        const now = Date.now();

        return RACETRACKS.map((track, index) => {
            const offset = index * 2 * 60 * 1000;
            const firstRaceStart = now + offset + (5 * 60 * 1000);

            return {
                trackId: track.id,
                raceNumber: 1,
                raceStartTime: firstRaceStart,
                raceSeed: this.generateRaceSeed(track.id, 1),
                horses: null
            };
        });
    }

    saveSchedule() {
        localStorage.setItem('raceSchedule', JSON.stringify(this.schedule));
    }

    getTrackStatus(trackId) {
        const now = Date.now();
        const trackSchedule = this.schedule.find(s => s.trackId === trackId);

        if (!trackSchedule) {
            return { phase: 'CLOSED', timeRemaining: 0, message: '未找到賽程' };
        }

        const raceStartTime = trackSchedule.raceStartTime;
        const raceEndTime = raceStartTime + this.raceDuration;
        const postRaceEndTime = raceEndTime + this.postRaceDuration;
        const preRaceStartTime = raceStartTime - this.preRaceDuration;
        const bettingStartTime = preRaceStartTime - this.bettingDuration;

        if (now >= raceStartTime && now < raceEndTime) {
            return {
                phase: 'RACING',
                timeRemaining: Math.floor((raceEndTime - now) / 1000),
                message: '比賽進行中',
                raceNumber: trackSchedule.raceNumber,
                raceSeed: trackSchedule.raceSeed
            };
        }

        if (now >= raceEndTime && now < postRaceEndTime) {
            return {
                phase: 'POST_RACE',
                timeRemaining: Math.floor((postRaceEndTime - now) / 1000),
                message: '正在審議比賽結果...',
                raceNumber: trackSchedule.raceNumber,
                raceSeed: trackSchedule.raceSeed
            };
        }

        if (now >= preRaceStartTime && now < raceStartTime) {
            return {
                phase: 'PRE_RACE',
                timeRemaining: Math.floor((raceStartTime - now) / 1000),
                message: '準備比賽',
                raceNumber: trackSchedule.raceNumber,
                raceSeed: trackSchedule.raceSeed
            };
        }

        if (now >= bettingStartTime && now < preRaceStartTime) {
            return {
                phase: 'BETTING',
                timeRemaining: Math.floor((preRaceStartTime - now) / 1000),
                message: '投注中',
                raceNumber: trackSchedule.raceNumber,
                raceSeed: trackSchedule.raceSeed
            };
        }

        if (now >= postRaceEndTime) {
            this.advanceToNextRace(trackId);
            return this.getTrackStatus(trackId);
        }

        return {
            phase: 'CLOSED',
            timeRemaining: Math.floor((bettingStartTime - now) / 1000),
            message: '準備下一場',
            raceNumber: trackSchedule.raceNumber
        };
    }

    advanceToNextRace(trackId) {
        const trackSchedule = this.schedule.find(s => s.trackId === trackId);
        if (!trackSchedule) return;

        const now = Date.now();
        const nextRaceNumber = trackSchedule.raceNumber + 1;
        const nextRaceStart = trackSchedule.raceStartTime + this.raceInterval;

        trackSchedule.raceNumber = nextRaceNumber;
        trackSchedule.raceStartTime = nextRaceStart;
        trackSchedule.raceSeed = this.generateRaceSeed(trackId, nextRaceNumber);
        trackSchedule.horses = null;
        trackSchedule.raceResults = null;

        this.saveSchedule();
        console.log(`🏁 ${trackId} 進入第 ${nextRaceNumber} 場`);
    }

    saveRaceResults(trackId, results) {
        const trackSchedule = this.schedule.find(s => s.trackId === trackId);
        if (!trackSchedule) {
            console.error(`無法儲存結果：找不到賽道 ${trackId}`);
            return;
        }

        console.log('📥 收到的原始結果:', results);

        const historyKey = `${trackId}_${trackSchedule.raceNumber}`;
        this.raceHistory[historyKey] = results.map(r => ({
            position: r.rank || r.position,
            horse: {
                id: r.horseId || r.horse?.id,
                name: r.horseName || r.horse?.name
            },
            finishTime: r.finishTime
        }));

        this.saveRaceHistory();
        console.log(`💾 已儲存 ${trackId} 第 ${trackSchedule.raceNumber} 場結果:`, this.raceHistory[historyKey]);
    }

    getRaceResults(trackId, raceNumber) {
        const historyKey = `${trackId}_${raceNumber}`;
        const results = this.raceHistory[historyKey] || null;
        console.log(`📤 讀取 ${trackId} 第 ${raceNumber} 場結果:`, results);
        return results;
    }

    loadRaceHistory() {
        const saved = localStorage.getItem('raceHistory');
        if (saved) {
            try {
                this.raceHistory = JSON.parse(saved);
            } catch (e) {
                console.error('歷史結果載入失敗', e);
                this.raceHistory = {};
            }
        }
    }

    saveRaceHistory() {
        localStorage.setItem('raceHistory', JSON.stringify(this.raceHistory));
    }

    // ====================================
    // Replay Data Management
    // ====================================

    saveReplayData(trackId, raceNumber, replayData) {
        const key = `${trackId}_${raceNumber}`;
        this.replayData[key] = replayData;
        this.saveReplayDataToStorage();
        console.log(`📼 已儲存 ${trackId} 第 ${raceNumber} 場重播數據`);
    }

    getReplayData(trackId, raceNumber) {
        const key = `${trackId}_${raceNumber}`;
        return this.replayData[key] || null;
    }

    loadReplayData() {
        const saved = localStorage.getItem('replayData');
        if (saved) {
            try {
                this.replayData = JSON.parse(saved);
            } catch (e) {
                console.error('重播數據載入失敗', e);
                this.replayData = {};
            }
        }
    }

    saveReplayDataToStorage() {
        localStorage.setItem('replayData', JSON.stringify(this.replayData));
    }

    // ====================================
    // **修正版：getTrackHistory**
    // ====================================

    getTrackHistory(trackId, count = 10) {
        const trackSchedule = this.schedule.find(s => s.trackId === trackId);
        if (!trackSchedule) return [];

        const currentRaceNumber = trackSchedule.raceNumber;
        const history = [];

        for (let i = 1; i <= count; i++) {
            const lookBackRaceNum = currentRaceNumber - i;
            if (lookBackRaceNum < 1) break;

            const key = `${trackId}_${lookBackRaceNum}`;
            let results = this.raceHistory[key];

            // **關鍵修正：檢查是否需要生成**
            const needsGeneration = !results ||
                (Array.isArray(results) && results.length === 0) ||
                !Array.isArray(results);

            if (needsGeneration) {
                console.log(`🔧 自動生成歷史記錄：${trackId} 第 ${lookBackRaceNum} 場`);

                // **確保生成函數可用**
                const canGenerate = this.checkGenerationCapability();

                if (canGenerate) {
                    try {
                        results = this.generatePastRaceResults(trackId, lookBackRaceNum);

                        // **驗證生成結果**
                        if (results && Array.isArray(results) && results.length > 0) {
                            this.raceHistory[key] = results;
                            this.saveRaceHistory();
                            console.log(`✅ 成功生成 ${trackId} 第 ${lookBackRaceNum} 場，共 ${results.length} 筆結果`);
                        } else {
                            console.error(`❌ 生成結果無效:`, results);
                            continue;
                        }
                    } catch (error) {
                        console.error(`❌ 生成歷史記錄失敗:`, error);
                        continue;
                    }
                } else {
                    console.warn(`⚠️ 無法生成歷史記錄：缺少必要的函數`);
                    continue;
                }
            }

            if (results && Array.isArray(results) && results.length > 0) {
                history.push({
                    raceNumber: lookBackRaceNum,
                    results: results,
                    timestamp: this.estimateRaceTime(trackId, lookBackRaceNum)
                });
            }
        }

        return history;
    }

    // ====================================
    // **新增：檢查生成能力**
    // ====================================
    checkGenerationCapability() {
        const hasGenerateHorses = typeof generateHorses === 'function';
        const hasBackgroundSimulator = typeof BackgroundSimulator !== 'undefined';

        console.log('📋 檢查生成能力:');
        console.log('  - generateHorses:', hasGenerateHorses);
        console.log('  - BackgroundSimulator:', hasBackgroundSimulator);

        return hasGenerateHorses && hasBackgroundSimulator;
    }

    // ====================================
    // **修正版：generatePastRaceResults**
    // ====================================

    generatePastRaceResults(trackId, raceNumber) {
        console.log(`🎲 開始生成 ${trackId} 第 ${raceNumber} 場的結果...`);

        // 1. Get seed
        const raceSeed = this.generateRaceSeed(trackId, raceNumber);
        console.log(`  種子碼: ${raceSeed}`);

        // 2. Generate horses
        if (typeof generateHorses !== 'function') {
            throw new Error('generateHorses 函數未定義');
        }
        const horses = generateHorses();
        console.log(`  生成馬匹: ${horses.length} 匹`);

        // 3. Assign gates and conditions
        const gates = [1, 2, 3, 4, 5, 6, 7, 8];
        const shuffleSeed = this.hashString(raceSeed + '_gates');
        for (let i = gates.length - 1; i > 0; i--) {
            const j = Math.floor((Math.sin(shuffleSeed + i) * 10000) % (i + 1));
            [gates[i], gates[Math.abs(j)]] = [gates[Math.abs(j)], gates[i]];
        }
        horses.forEach((horse, index) => {
            horse.gateNumber = gates[index];
            const seedValue = this.hashString(raceSeed + horse.id);
            horse.todayCondition = horse.generateTodayCondition(seedValue);
        });

        // 4. 執行物理模擬
        const track = this.getTrackData(trackId);

        if (typeof BackgroundSimulator === 'undefined') {
            throw new Error('BackgroundSimulator 未定義');
        }

        console.log(`  使用 BackgroundSimulator 模擬...`);
        const bgSim = new BackgroundSimulator(horses, track, raceSeed);
        const simData = bgSim.runFullSimulation();

        console.log(`  模擬完成:`, simData.results.length, '個結果');

        // 5. 存儲重播數據
        this.saveReplayData(trackId, raceNumber, simData);

        // 6. Format results
        const formattedResults = simData.results.map(r => ({
            position: r.position,
            horse: {
                id: r.horse.id,
                name: r.horse.name
            },
            finishTime: r.finishTime
        }));

        console.log(`✅ 生成完成，結果:`, formattedResults);
        return formattedResults;
    }

    getTrackSchedule(trackId, futureRaces = 5) {
        const trackSchedule = this.schedule.find(s => s.trackId === trackId);
        if (!trackSchedule) return [];

        const schedule = [];
        const currentRaceNumber = trackSchedule.raceNumber;
        const currentRaceStart = trackSchedule.raceStartTime;

        for (let i = 0; i < futureRaces; i++) {
            const raceNumber = currentRaceNumber + i;
            const raceStartTime = currentRaceStart + (i * this.raceInterval);

            schedule.push({
                raceNumber: raceNumber,
                raceStartTime: raceStartTime,
                isCurrent: i === 0
            });
        }

        return schedule;
    }

    estimateRaceTime(trackId, raceNumber) {
        const trackSchedule = this.schedule.find(s => s.trackId === trackId);
        if (!trackSchedule) return null;

        const currentRaceNumber = trackSchedule.raceNumber;
        const currentRaceStart = trackSchedule.raceStartTime;

        const racesDiff = currentRaceNumber - raceNumber;
        return currentRaceStart - (racesDiff * this.raceInterval);
    }

    generateRaceSeed(trackId, raceNumber) {
        const seedKey = `${trackId}_${raceNumber}`;
        if (!this.raceSeeds[seedKey]) {
            this.raceSeeds[seedKey] = `${trackId}_R${raceNumber}_${Date.now()}_${Math.random()}`;
            this.saveRaceSeeds();
        }
        return this.raceSeeds[seedKey];
    }

    saveRaceSeeds() {
        localStorage.setItem('raceSeeds', JSON.stringify(this.raceSeeds));
    }

    loadRaceSeeds() {
        const saved = localStorage.getItem('raceSeeds');
        if (saved) {
            try {
                this.raceSeeds = JSON.parse(saved);
            } catch (e) {
                console.error('種子碼載入失敗', e);
                this.raceSeeds = {};
            }
        }
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    getOrGenerateHorses(trackId) {
        const trackSchedule = this.schedule.find(s => s.trackId === trackId);
        if (!trackSchedule) return null;

        if (!trackSchedule.horses) {
            const horses = generateHorses();

            const raceSeed = trackSchedule.raceSeed;

            const gates = [1, 2, 3, 4, 5, 6, 7, 8];
            const shuffleSeed = this.hashString(raceSeed + '_gates');
            for (let i = gates.length - 1; i > 0; i--) {
                const j = Math.floor((Math.sin(shuffleSeed + i) * 10000) % (i + 1));
                [gates[i], gates[Math.abs(j)]] = [gates[Math.abs(j)], gates[i]];
            }

            horses.forEach((horse, index) => {
                horse.gateNumber = gates[index];
                const seedValue = this.hashString(raceSeed + horse.id);
                horse.todayCondition = horse.generateTodayCondition(seedValue);
            });

            horses.raceSeed = raceSeed;

            trackSchedule.horses = horses;
            this.saveSchedule();
        }

        return trackSchedule.horses;
    }

    getAllTrackStatuses() {
        return RACETRACKS.map(track => ({
            trackId: track.id,
            trackName: track.name,
            flagEmoji: track.flagEmoji,
            ...this.getTrackStatus(track.id)
        }));
    }

    resetSchedule() {
        localStorage.removeItem('raceSchedule');
        this.schedule = this.generateInitialSchedule();
        this.saveSchedule();
        console.log('🔄 賽程已重置');
    }

    getTrackData(trackId) {
        return RACETRACKS.find(t => t.id === trackId);
    }
}

const raceScheduler = new RaceScheduler();