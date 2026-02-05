// ====================================
// Race Simulator - Main Engine
// 整合所有模組：Frenet座標、物理、AI、轉向
// ====================================

class RaceSimulator {
    constructor(trackPath, horses) {
        // 核心模組
        this.frenet = new FrenetCoordinate(trackPath);
        this.physics = new PhysicsEngine();
        this.steering = new SteeringBehavior();
        this.jockeyAI = new JockeyAI();

        // 賽馬資料
        this.horses = horses;
        this.trackPath = trackPath;

        // 比賽狀態
        this.isRunning = false;
        this.raceTime = 0;
        this.finishOrder = [];

        // 初始化馬匹
        this.initializeHorses();
    }

    // ====================================
    // 初始化
    // ====================================

    initializeHorses() {
        for (let i = 0; i < this.horses.length; i++) {
            const horse = this.horses[i];

            // 設定起跑位置（Frenet 座標）
            // **錯開起跑位置**：外側馬稍微靠後，避免完全對齊造成碰撞
            horse.s = -i * 0.5; // 每條跑道錯開 0.5m
            // **確保 8 條獨立跑道**：增加間隔到 2.0 米（更安全）
            horse.d = 1.0 + (i * 2.0);  // 1.0, 3.0, 5.0, 7.0, 9.0, 11.0, 13.0, 15.0米
            horse.speed = 0; // 起跑時速度為0

            // 基礎速度（根據 competitiveFactor，增強差異）
            // competitiveFactor 80-100 → baseSpeed 12-18 m/s
            horse.baseSpeed = 8 + (horse.competitiveFactor * 0.1);

            // AI 狀態
            horse.anxiety = 0;
            horse.isBoxedIn = false;
            horse.lateralSpeed = 0;

            // 偏好跑道（增加多樣性）
            // 不是所有馬都想要內欄！
            if (horse.runningStyle === '逃') {
                horse.preferredD = 0.8 + Math.random() * 0.5; // 逃馬：0.8-1.3米
            } else if (horse.runningStyle === '前') {
                horse.preferredD = 1.5 + Math.random() * 1.0; // 前腳：1.5-2.5米
            } else if (horse.runningStyle === '追' || horse.runningStyle === '殿') {
                horse.preferredD = 2.5 + Math.random() * 1.5; // 追/殿：2.5-4.0米
            } else {
                horse.preferredD = 1.0 + Math.random() * 2.0; // 預設：1.0-3.0米
            }

            // 剛體半徑（用於碰撞檢測）
            horse.bodyRadius = 0.6; // 0.6米半徑
            horse.mass = 450 + Math.random() * 50; // 450-500kg

            // 紀錄
            horse.finished = false;
            horse.finishTime = null;
            horse.positionHistory = []; // 軌跡記錄
        }
    }

    // ====================================
    // 比賽控制
    // ====================================

    startRace() {
        this.isRunning = true;
        this.raceTime = 0;
        this.finishOrder = [];
        this.lastUpdateTime = performance.now();

        // 開閘！所有馬匹起跑
        this.horses.forEach(horse => {
            horse.speed = horse.baseSpeed * 0.8; // 起跑速度
        });
    }

    stopRace() {
        this.isRunning = false;
    }

    // ====================================
    // 主更新循環
    // ====================================

    update() {
        if (!this.isRunning) return;

        const now = performance.now();
        const deltaTime = Math.min((now - this.lastUpdateTime) / 1000, 0.1); // 最多0.1秒
        this.lastUpdateTime = now;

        this.raceTime += deltaTime;
        const raceProgress = this.calculateRaceProgress();

        // 更新每匹馬
        for (const horse of this.horses) {
            if (horse.finished) continue;

            // 1. AI 決策
            const decision = this.jockeyAI.makeDecision(
                horse,
                this.horses,
                this.frenet,
                raceProgress
            );

            // 2. 計算轉向力
            const lateralForce = this.steering.compute(
                horse,
                this.horses,
                this.frenet.getTrackWidth()
            );

            // 3. 物理更新
            this.physics.update(horse, this.frenet, deltaTime, lateralForce);

            // 4. 應用戰術速度
            this.physics.applyStrategySpeed(horse, raceProgress);

            // 5. 檢查 Slingshot 機會
            this.physics.checkSlingshotOpportunity(horse, this.frenet, this.horses);

            // 6. 記錄軌跡
            horse.positionHistory.push({ s: horse.s, d: horse.d, time: this.raceTime });
            if (horse.positionHistory.length > 100) {
                horse.positionHistory.shift(); // 只保留最近100個點
            }

            // 7. 檢查是否完賽
            if (horse.s >= this.frenet.pathLength) {
                horse.finished = true;
                horse.finishTime = this.raceTime;
                this.finishOrder.push(horse);
            }
        }

        // **關鍵：位置衝量修正**（避免重疊）
        // 需要多次迭代才能完全解決碰撞
        for (let iteration = 0; iteration < 5; iteration++) {
            this.resolveCollisions();
        }

        // 檢查是否所有馬匹都完賽
        if (this.finishOrder.length === this.horses.length) {
            this.isRunning = false;
        }
    }

    calculateRaceProgress() {
        // 計算比賽進度（基於領先馬）
        let maxS = 0;
        for (const horse of this.horses) {
            maxS = Math.max(maxS, horse.s);
        }
        return maxS / this.frenet.pathLength;
    }

    // ====================================
    // 渲染（提供給 Canvas）
    // ====================================

    getHorseWorldPositions() {
        // 返回所有馬匹的世界座標（供渲染使用）
        return this.horses.map(horse => {
            const worldPos = this.frenet.frenetToWorld(horse.s, horse.d);
            return {
                ...horse,
                worldX: worldPos.x,
                worldY: worldPos.y,
                heading: worldPos.heading
            };
        });
    }

    // ====================================
    // 結果查詢
    // ====================================

    getResults() {
        // 返回完賽順序
        return this.finishOrder.map((horse, index) => ({
            position: index + 1,
            horse: horse,
            finishTime: horse.finishTime
        }));
    }

    getRaceState() {
        // 返回當前比賽狀態（供 UI 顯示）
        return {
            isRunning: this.isRunning,
            raceTime: this.raceTime,
            raceProgress: this.calculateRaceProgress(),
            leaderboard: this.getCurrentLeaderboard()
        };
    }

    getCurrentLeaderboard() {
        // 當前排名
        const sorted = [...this.horses].sort((a, b) => b.s - a.s);
        return sorted.map((horse, index) => ({
            position: index + 1,
            horse: horse,
            distance: horse.s,
            isBoxedIn: horse.isBoxedIn
        }));
    }

    // ====================================
    // 除錯資訊
    // ====================================

    getDebugInfo(horseId) {
        // 返回特定馬匹的除錯資訊
        const horse = this.horses.find(h => h.id === horseId);
        if (!horse) return null;

        return {
            frenet: { s: horse.s, d: horse.d },
            speed: horse.speed,
            lateralSpeed: horse.lateralSpeed,
            isBoxedIn: horse.isBoxedIn,
            anxiety: horse.anxiety,
            runningStyle: horse.runningStyle,
            cornerRadius: this.frenet.getCornerRadiusAt(horse.s)
        };
    }

    // ====================================
    // 碰撞解決（位置衝量修正）
    // ====================================

    resolveCollisions() {
        // 檢查所有馬匹對，如果重疊則強制分開
        for (let i = 0; i < this.horses.length; i++) {
            for (let j = i + 1; j < this.horses.length; j++) {
                const horseA = this.horses[i];
                const horseB = this.horses[j];

                if (horseA.finished || horseB.finished) continue;

                const deltaS = horseB.s - horseA.s;
                const deltaD = horseB.d - horseA.d;
                const distance = Math.sqrt(deltaS * deltaS + deltaD * deltaD);

                const minDistance = (horseA.bodyRadius || 0.6) + (horseB.bodyRadius || 0.6);

                // 如果重疊了
                if (distance < minDistance && distance > 0) {
                    const overlap = minDistance - distance;

                    // 計算推開方向（單位向量）
                    const pushDirD = deltaD / distance;
                    const pushDirS = deltaS / distance;

                    // 根據質量比例分配位移
                    const massA = horseA.mass || 500;
                    const massB = horseB.mass || 500;
                    const totalMass = massA + massB;

                    const ratioA = massB / totalMass;  // 質量大的馬移動少
                    const ratioB = massA / totalMass;

                    // **橫向距離判斷**：如果橫向距離很近（在同一跑道）
                    const isDirectCollision = Math.abs(deltaD) < 1.5;

                    if (isDirectCollision) {
                        // **同跑道碰撞**：主要修正縱向，防止穿模

                        // 縱向修正：強制分開
                        horseA.s -= pushDirS * overlap * ratioA * 0.8;
                        horseB.s += pushDirS * overlap * ratioB * 0.8;

                        // 橫向修正：輕微推開
                        horseA.d -= pushDirD * overlap * ratioA * 0.5;
                        horseB.d += pushDirD * overlap * ratioB * 0.5;

                        // **速度調整**：後方馬強制減速
                        if (deltaS > 0) {
                            // B 在 A 後方，B 減速
                            horseB.speed *= 0.92;
                        } else {
                            // A 在 B 後方，A 減速
                            horseA.speed *= 0.92;
                        }
                    } else {
                        // **不同跑道側面碰撞**：主要修正橫向

                        // 橫向修正：主要修正方向
                        horseA.d -= pushDirD * overlap * ratioA;
                        horseB.d += pushDirD * overlap * ratioB;

                        // 縱向修正：輕微
                        horseA.s -= pushDirS * overlap * ratioA * 0.3;
                        horseB.s += pushDirS * overlap * ratioB * 0.3;

                        // 輕微減速
                        horseA.speed *= 0.97;
                        horseB.speed *= 0.97;
                    }

                    // 限制在賽道範圍內
                    const trackWidth = this.frenet.getTrackWidth();
                    horseA.d = Math.max(0.5, Math.min(horseA.d, trackWidth - 0.5));
                    horseB.d = Math.max(0.5, Math.min(horseB.d, trackWidth - 0.5));
                }
            }
        }
    }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RaceSimulator;
}