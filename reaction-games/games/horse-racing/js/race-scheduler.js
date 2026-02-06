// ====================================
// Race Scheduler
// Server-side scheduling with localStorage persistence
// ====================================

class RaceScheduler {
    constructor() {
        this.raceInterval = 6.25 * 60 * 1000; // 6.25 minutes per race cycle (adjusted)
        this.bettingDuration = 5 * 60 * 1000; // 5 minutes betting
        this.preRaceDuration = 15 * 1000; // 15 seconds pre-race (NEW)
        this.raceDuration = 30 * 1000; // 30 seconds racing
        this.postRaceDuration = 15 * 1000; // 15 seconds post-race
        this.closedDuration = 75 * 1000; // 1 minute 15 seconds prep

        this.raceSeeds = {}; // 儲存每場比賽的種子碼
        this.loadRaceSeeds();

        this.schedule = null;
        this.loadOrInitializeSchedule();
    }

    // ====================================
    // Initialization & Persistence
    // ====================================

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

        // Stagger each track by 2 minutes
        return RACETRACKS.map((track, index) => {
            const offset = index * 2 * 60 * 1000;
            const firstRaceStart = now + offset + (5 * 60 * 1000); // Start first race in 5 min

            return {
                trackId: track.id,
                raceNumber: 1,
                raceStartTime: firstRaceStart,
                raceSeed: this.generateRaceSeed(track.id, 1),
                horses: null // Will be generated when needed
            };
        });
    }

    saveSchedule() {
        localStorage.setItem('raceSchedule', JSON.stringify(this.schedule));
    }

    // ====================================
    // Track Status
    // ====================================

    getTrackStatus(trackId) {
        const now = Date.now();
        const trackSchedule = this.schedule.find(s => s.trackId === trackId);

        if (!trackSchedule) {
            return { phase: 'CLOSED', timeRemaining: 0, message: '未找到賽程' };
        }

        const raceStartTime = trackSchedule.raceStartTime;
        const raceEndTime = raceStartTime + this.raceDuration;
        const postRaceEndTime = raceEndTime + this.postRaceDuration;
        const preRaceStartTime = raceStartTime - this.preRaceDuration; // NEW
        const bettingStartTime = preRaceStartTime - this.bettingDuration; // UPDATED

        const timeSinceRaceStart = now - raceStartTime;
        const timeUntilRaceStart = raceStartTime - now;

        // RACING (30 seconds)
        if (now >= raceStartTime && now < raceEndTime) {
            return {
                phase: 'RACING',
                timeRemaining: Math.floor((raceEndTime - now) / 1000),
                message: '比賽進行中',
                raceNumber: trackSchedule.raceNumber,
                raceSeed: trackSchedule.raceSeed
            };
        }

        // POST_RACE (15 seconds after race)
        if (now >= raceEndTime && now < postRaceEndTime) {
            return {
                phase: 'POST_RACE',
                timeRemaining: Math.floor((postRaceEndTime - now) / 1000),
                message: '正在審議比賽結果...',
                raceNumber: trackSchedule.raceNumber,
                raceSeed: trackSchedule.raceSeed
            };
        }

        // PRE_RACE (15 seconds before race) - NEW PHASE
        if (now >= preRaceStartTime && now < raceStartTime) {
            return {
                phase: 'PRE_RACE',
                timeRemaining: Math.floor((raceStartTime - now) / 1000),
                message: '準備比賽',
                raceNumber: trackSchedule.raceNumber,
                raceSeed: trackSchedule.raceSeed
            };
        }

        // BETTING (5 minutes before pre-race)
        if (now >= bettingStartTime && now < preRaceStartTime) {
            return {
                phase: 'BETTING',
                timeRemaining: Math.floor((preRaceStartTime - now) / 1000),
                message: '投注中',
                raceNumber: trackSchedule.raceNumber,
                raceSeed: trackSchedule.raceSeed
            };
        }

        // CLOSED (waiting for next race)
        // Auto-advance to next race if post-race period ended
        if (now >= postRaceEndTime) {
            this.advanceToNextRace(trackId);
            return this.getTrackStatus(trackId); // Recursive call with new schedule
        }

        return {
            phase: 'CLOSED',
            timeRemaining: Math.floor((bettingStartTime - now) / 1000),
            message: '準備下一場',
            raceNumber: trackSchedule.raceNumber
        };
    }

    // ====================================
    // Race Advancement
    // ====================================

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

        this.saveSchedule();
        console.log(`🏁 ${trackId} 進入第 ${nextRaceNumber} 場`);
    }

    // ====================================
    // Seed Generation & Management
    // ====================================

    generateRaceSeed(trackId, raceNumber) {
        const seedKey = `${trackId}_${raceNumber}`;
        if (!this.raceSeeds[seedKey]) {
            // 只在第一次生成，之後都重複使用
            this.raceSeeds[seedKey] = `${trackId}_R${raceNumber}_${Date.now()}_${Math.random()}`;
            this.saveRaceSeeds(); // 立即存入 localStorage
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

    // 簡單的字串雜湊函數
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    // ====================================
    // Horse Management
    // ====================================

    getOrGenerateHorses(trackId) {
        const trackSchedule = this.schedule.find(s => s.trackId === trackId);
        if (!trackSchedule) return null;

        // Generate horses if not yet generated
        if (!trackSchedule.horses) {
            const horses = generateHorses();

            // 獲取這場比賽的種子碼
            const raceSeed = trackSchedule.raceSeed;

            // 隨機分配檔位（避免強馬總是在好檔位）
            const gates = [1, 2, 3, 4, 5, 6, 7, 8];
            // 使用種子打亂檔位
            const shuffleSeed = this.hashString(raceSeed + '_gates');
            for (let i = gates.length - 1; i > 0; i--) {
                const j = Math.floor((Math.sin(shuffleSeed + i) * 10000) % (i + 1));
                [gates[i], gates[Math.abs(j)]] = [gates[Math.abs(j)], gates[i]];
            }

            horses.forEach((horse, index) => {
                horse.gateNumber = gates[index];
                // 使用種子生成當日狀態（確保多設備同步）
                const seedValue = this.hashString(raceSeed + horse.id);
                horse.todayCondition = horse.generateTodayCondition(seedValue);
            });

            // 儲存種子碼供比賽結果使用
            horses.raceSeed = raceSeed;

            trackSchedule.horses = horses;
            this.saveSchedule();
        }

        return trackSchedule.horses;
    }

    // ====================================
    // Utility
    // ====================================

    getAllTrackStatuses() {
        return RACETRACKS.map(track => ({
            trackId: track.id,
            trackName: track.name,
            flagEmoji: track.flagEmoji,
            ...this.getTrackStatus(track.id)
        }));
    }

    // Reset schedule (for testing/debugging)
    resetSchedule() {
        localStorage.removeItem('raceSchedule');
        this.schedule = this.generateInitialSchedule();
        this.saveSchedule();
        console.log('🔄 賽程已重置');
    }

    // Get track data
    getTrackData(trackId) {
        return RACETRACKS.find(t => t.id === trackId);
    }
}

// Create global instance
const raceScheduler = new RaceScheduler();
