// ====================================
// Background Simulator
// 在後台執行完整物理模擬（無渲染）
// 用於未被觀看的比賽，確保時間一致性
// ====================================

class BackgroundSimulator {
    constructor(horses, trackData, raceSeed) {
        this.trackData = trackData;
        this.raceSeed = raceSeed;
        this.horses = horses;
        this.simulator = null;
        this.replayData = null;
    }

    /**
     * 快速執行完整比賽（無渲染）
     * 使用物理模擬 + raceResultGenerator 數據注入
     */
    runFullSimulation() {
        console.log(`🎬 開始後台模擬比賽 (Seed: ${this.raceSeed.substring(0, 20)}...)`);
        const startTime = performance.now();

        // 1. 建立賽道路徑
        const trackPath = this.createStadiumPath();

        // 2. 轉換馬匹格式（注入 raceResultGenerator 數據）
        const simulatorHorses = this.convertHorsesToSimulatorFormat(this.horses);

        // 3. 計算比賽距離
        const pathLength = this.calculatePathLength(trackPath);
        const straightLength = 230;
        const finishS = 0 + straightLength / 2;
        const raceDistance = pathLength + finishS;

        // 4. 初始化模擬器（傳遞種子碼以確保確定性）
        this.simulator = new RaceSimulator(trackPath, simulatorHorses, {
            raceDistance: raceDistance,
            trackWidth: 17.5,
            raceSeed: this.raceSeed
        });

        console.log('  🏁 模擬器初始化完成:');
        console.log('    - 賽道距離:', this.simulator.raceDistance);
        console.log('    - 馬匹數量:', this.simulator.horses.length);

        // 5. 啟動比賽
        this.simulator.startRace();

        // 修正：同步起始位置 (RaceEngineAdapter 設定 s = 115)
        // straightLength(230) / 2 = 115
        const startS = 115;
        this.simulator.horses.forEach(h => {
            h.s = startS;
        });

        // 6. 執行物理模擬循環 - 使用固定時間步長
        const FIXED_TIMESTEP = 1 / 60; // 60 FPS
        const trajectory = [];
        let frameCount = 0;
        const SAMPLE_INTERVAL = 0.5; // 每0.5秒記錄一次
        let nextSampleTime = 0;

        while (this.simulator.isRunning && frameCount < 20000) {
            this.simulator.updateWithFixedDelta(FIXED_TIMESTEP);
            frameCount++;

            // 定期記錄軌跡
            if (this.simulator.raceTime >= nextSampleTime) {
                trajectory.push(this.captureFrame());
                nextSampleTime += SAMPLE_INTERVAL;
            }

            // 每 1000 幀輸出進度
            if (frameCount % 1000 === 0) {
                const maxS = Math.max(...this.simulator.horses.map(h => h.s));
                console.log(`    [Frame ${frameCount}] 進度: ${maxS.toFixed(1)}/${this.simulator.raceDistance.toFixed(1)}, 完賽: ${this.simulator.finishOrder.length}/${this.simulator.horses.length}`);
            }

            // 所有馬匹完賽就停止
            if (this.simulator.finishOrder.length === this.simulator.horses.length) {
                console.log('  ✅ 所有馬匹已完賽');
                break;
            }
        }

        // 7. 收集結果
        const results = this.simulator.getResults();
        const duration = this.simulator.raceTime;

        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ 後台模擬完成: ${duration.toFixed(1)}s 比賽時間 (執行耗時: ${elapsed}s, ${frameCount} 幀)`);

        this.replayData = {
            trajectory,
            results,
            duration,
            raceSeed: this.raceSeed,
            timestamp: Date.now()
        };

        return this.replayData;
    }

    /**
     * 捕獲當前幀的狀態
     */
    captureFrame() {
        return {
            time: this.simulator.raceTime,
            horses: this.simulator.horses.map(h => ({
                id: h.id,
                s: h.s,
                d: h.d,
                speed: h.speed,
                finished: h.finished
            }))
        };
    }

    /**
     * 創建操場型賽道路徑（與 RaceEngineAdapter 一致）
     */
    createStadiumPath() {
        const points = [];
        const straightLength = 230;
        const cornerRadius = 100; // 修正與 Adapter 一致 (原本 115)
        const centerY = 150;

        // 上直道
        for (let x = 0; x <= straightLength; x += 5) {
            points.push({ x: x, y: centerY - cornerRadius });
        }

        // 右彎道
        const steps = 50;
        for (let i = 0; i <= steps; i++) {
            const angle = (Math.PI / 2) * (i / steps) - Math.PI / 2;
            points.push({
                x: straightLength + Math.cos(angle) * cornerRadius,
                y: centerY + Math.sin(angle) * cornerRadius
            });
        }

        // 下直道（反向）
        for (let x = straightLength; x >= 0; x -= 5) {
            points.push({ x: x, y: centerY + cornerRadius });
        }

        // 左彎道
        for (let i = 0; i <= steps; i++) {
            const angle = (Math.PI / 2) * (i / steps) + Math.PI / 2;
            points.push({
                x: 0 + Math.cos(angle) * cornerRadius,
                y: centerY + Math.sin(angle) * cornerRadius
            });
        }

        return points;
    }

    /**
     * 計算路徑長度
     */
    calculatePathLength(path) {
        let length = 0;
        for (let i = 1; i < path.length; i++) {
            const dx = path[i].x - path[i - 1].x;
            const dy = path[i].y - path[i - 1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        // 閉合路徑
        const last = path[path.length - 1];
        const first = path[0];
        length += Math.sqrt((first.x - last.x) ** 2 + (first.y - last.y) ** 2);
        return length;
    }

    /**
     * 轉換馬匹格式為模擬器格式（注入 raceResultGenerator 數據）
     */
    convertHorsesToSimulatorFormat(gameHorses) {
        // 1. 使用 raceResultGenerator 獲取確定性的表現數據
        const performanceMap = new Map();

        let generator = window.raceResultGenerator;
        if (!generator && typeof RaceResultGenerator !== 'undefined') {
            generator = new RaceResultGenerator();
        }

        if (generator) {
            const results = generator.generateResults(gameHorses, this.raceSeed);
            results.forEach(res => {
                performanceMap.set(res.horse.id, res.horse);
            });
        }

        return gameHorses.map((horse, index) => {
            const perfData = performanceMap.get(horse.id);
            // 修正：與 RaceEngineAdapter 一致，使用 form 作為 competitiveFactor
            const form = horse.form || 50;

            return {
                id: horse.id,
                name: horse.name,
                gateNumber: horse.gateNumber || (index + 1),
                competitiveFactor: form, // 修正：使用 form (預設50)
                runningStyle: horse.runningStyle || this.inferRunningStyle(horse.lastFiveTrend),
                jockey: horse.jockey,
                weight: horse.weight,
                age: horse.age,
                // 注入 raceResultGenerator 的數據
                finalPerformance: perfData ? perfData.finalPerformance : undefined,
                incidents: perfData ? perfData.incidents : undefined
            };
        });
    }

    /**
     * 推斷跑法
     */
    inferRunningStyle(form) {
        if (!form || form.length === 0) return '差';
        const avg = form.reduce((a, b) => a + b, 0) / form.length;
        if (avg <= 2) return '逃';
        if (avg <= 3.5) return '先';
        if (avg <= 5.5) return '差';
        return '追';
    }

    /**
     * 獲取重播數據
     */
    getReplayData() {
        return this.replayData;
    }

    /**
     * 獲取比賽結果（格式化）
     */
    getFormattedResults() {
        if (!this.replayData) return null;

        return this.replayData.results.map(r => ({
            position: r.position,
            horse: {
                id: r.horse.id,
                name: r.horse.name
            },
            finishTime: r.finishTime
        }));
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundSimulator;
}
