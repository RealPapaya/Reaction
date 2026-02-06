// ====================================
// Race Simulator (V4 - 修正卡頓 + 增加隨機性)
// 關鍵修正：
// 1. 降低碰撞縱向修正強度
// 2. 添加初始化隨機性
// 3. 添加起跑延遲
// ====================================

class RaceSimulator {
    constructor(trackPath, horses) {
        this.frenet = new FrenetCoordinate(trackPath);
        this.physics = new PhysicsEngine();
        this.steering = new SteeringBehavior();
        this.jockeyAI = new JockeyAI();

        this.horses = horses;
        this.trackPath = trackPath;

        this.isRunning = false;
        this.raceTime = 0;
        this.finishOrder = [];

        this.initializeHorses();
    }

    // ====================================
    // **修正：增加隨機性**
    // ====================================
    initializeHorses() {
        for (let i = 0; i < this.horses.length; i++) {
            const horse = this.horses[i];

            // **1. 隨機起始位置** (±0.5米)
            horse.s = -i * 0.5 + (Math.random() - 0.5) * 1.0;

            // **2. 隨機起跑道** (±0.3米)
            horse.d = 1.0 + (i * 2.0) + (Math.random() - 0.5) * 0.6;

            horse.speed = 0;

            // **3. baseSpeed 添加隨機波動** (±3%)
            const baseFactor = 8 + (horse.competitiveFactor * 0.1);
            horse.baseSpeed = baseFactor * (0.97 + Math.random() * 0.06);

            // **4. 隨機起跑反應時間** (0-0.3秒)
            horse.startDelay = Math.random() * 0.3;
            horse.hasStarted = false;

            horse.anxiety = 0;
            horse.isBoxedIn = false;
            horse.lateralSpeed = 0;

            horse.isOvertaking = false;
            horse.overtakeTarget = null;
            horse.speedDamping = 1.0;

            horse.bodyRadius = 1.0;

            // **5. preferredD 添加更多隨機性**
            if (horse.runningStyle === '逃') {
                horse.preferredD = 0.6 + Math.random() * 0.8; // 0.6-1.4
            } else if (horse.runningStyle === '前') {
                horse.preferredD = 1.2 + Math.random() * 1.2; // 1.2-2.4
            } else if (horse.runningStyle === '追' || horse.runningStyle === '殿') {
                horse.preferredD = 2.0 + Math.random() * 2.0; // 2.0-4.0
            } else {
                horse.preferredD = 1.0 + Math.random() * 2.5; // 1.0-3.5
            }

            // **6. 隨機質量** (增大範圍)
            horse.mass = 440 + Math.random() * 60; // 440-500kg

            horse.finished = false;
            horse.finishTime = null;
            horse.positionHistory = [];

            // **7. 清空上一場比賽的狀態**
            horse.lastCornerRadius = undefined;
            horse.stamina = undefined;
        }
    }

    startRace() {
        this.isRunning = true;
        this.raceTime = 0;
        this.finishOrder = [];
        this.lastUpdateTime = performance.now();

        this.horses.forEach(horse => {
            horse.speed = horse.baseSpeed * 0.8;
            horse.hasStarted = false; // 重置起跑狀態
        });
    }

    stopRace() {
        this.isRunning = false;
    }

    update() {
        if (!this.isRunning) return;

        const now = performance.now();
        const deltaTime = Math.min((now - this.lastUpdateTime) / 1000, 0.1);
        this.lastUpdateTime = now;

        this.raceTime += deltaTime;
        const raceProgress = this.calculateRaceProgress();

        for (const horse of this.horses) {
            if (horse.finished) continue;

            // **起跑延遲處理**
            if (!horse.hasStarted) {
                if (this.raceTime >= horse.startDelay) {
                    horse.hasStarted = true;
                } else {
                    continue; // 還沒起跑,跳過這匹馬
                }
            }

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
                horse.positionHistory.shift();
            }

            // 7. 檢查是否完賽
            if (horse.s >= this.frenet.pathLength) {
                horse.finished = true;
                horse.finishTime = this.raceTime;
                this.finishOrder.push(horse);
            }
        }

        // **碰撞解決（降低強度）**
        this.resolveCollisions();

        if (this.finishOrder.length === this.horses.length) {
            this.isRunning = false;
        }
    }

    calculateRaceProgress() {
        let maxS = 0;
        for (const horse of this.horses) {
            if (horse.hasStarted) {
                maxS = Math.max(maxS, horse.s);
            }
        }
        return maxS / this.frenet.pathLength;
    }

    // ====================================
    // **碰撞解決（V4 - 降低強度）**
    // ====================================

    resolveCollisions() {
        for (let i = 0; i < this.horses.length; i++) {
            for (let j = i + 1; j < this.horses.length; j++) {
                const horseA = this.horses[i];
                const horseB = this.horses[j];

                if (horseA.finished || horseB.finished) continue;
                if (!horseA.hasStarted || !horseB.hasStarted) continue; // 還沒起跑的不碰撞

                const deltaS = horseB.s - horseA.s;
                const deltaD = horseB.d - horseA.d;
                const distance = Math.sqrt(deltaS * deltaS + deltaD * deltaD);

                const minDistance = 2.0;

                if (distance < minDistance && distance > 0.01) {
                    const overlap = minDistance - distance;

                    const pushDirD = deltaD / distance;
                    const pushDirS = deltaS / distance;

                    const massA = horseA.mass || 500;
                    const massB = horseB.mass || 500;
                    const totalMass = massA + massB;
                    const ratioA = massB / totalMass;
                    const ratioB = massA / totalMass;

                    const isDirectCollision = Math.abs(deltaD) < 1.5;

                    // **新增：彎道檢測**
                    const cornerRadiusA = this.frenet.getCornerRadiusAt(horseA.s);
                    const cornerRadiusB = this.frenet.getCornerRadiusAt(horseB.s);
                    const inCorner = (cornerRadiusA < Infinity) || (cornerRadiusB < Infinity);

                    // **彎道修正係數**：彎道中減半所有碰撞修正
                    const cornerFactor = inCorner ? 0.5 : 1.0;

                    if (isDirectCollision) {
                        // **同跑道碰撞：降低縱向修正**

                        // **1. 縱向位置修正** - 應用彎道係數
                        const longitudinalCorrection = 0.25 * cornerFactor;
                        horseA.s -= pushDirS * overlap * ratioA * longitudinalCorrection;
                        horseB.s += pushDirS * overlap * ratioB * longitudinalCorrection;

                        // **2. 橫向位置修正** - 應用彎道係數
                        const lateralCorrection = 0.15 * cornerFactor;
                        horseA.d -= pushDirD * overlap * ratioA * lateralCorrection;
                        horseB.d += pushDirD * overlap * ratioB * lateralCorrection;

                        // **3. 速度調整** - 應用彎道係數
                        const speedCorrection = 0.20 * cornerFactor;

                        if (deltaS > 0) {
                            // B 在 A 後方，B 強制減速
                            if (!horseB.speedDamping) horseB.speedDamping = 1.0;
                            horseB.speedDamping *= (1.0 - speedCorrection);

                            // 重疊嚴重時立即減速（彎道中更輕微）
                            if (overlap > minDistance * 0.5) {
                                horseB.speed *= (0.97 + (1 - cornerFactor) * 0.02);
                            }
                        } else {
                            // A 在 B 後方，A 強制減速
                            if (!horseA.speedDamping) horseA.speedDamping = 1.0;
                            horseA.speedDamping *= (1.0 - speedCorrection);

                            if (overlap > minDistance * 0.5) {
                                horseA.speed *= (0.97 + (1 - cornerFactor) * 0.02);
                            }
                        }

                        // **4. 橫向速度推開** - 應用彎道係數
                        const lateralPush = overlap * 0.2 * cornerFactor;
                        if (!horseA.lateralSpeed) horseA.lateralSpeed = 0;
                        if (!horseB.lateralSpeed) horseB.lateralSpeed = 0;

                        horseA.lateralSpeed -= pushDirD * lateralPush * ratioA;
                        horseB.lateralSpeed += pushDirD * lateralPush * ratioB;

                    } else {
                        // **側面碰撞：主要橫向分離** - 應用彎道係數

                        // 橫向位置修正
                        const lateralCorrection = 0.6 * cornerFactor;
                        horseA.d -= pushDirD * overlap * ratioA * lateralCorrection;
                        horseB.d += pushDirD * overlap * ratioB * lateralCorrection;

                        // 縱向位置修正
                        const longitudinalCorrection = 0.15 * cornerFactor;
                        horseA.s -= pushDirS * overlap * ratioA * longitudinalCorrection;
                        horseB.s += pushDirS * overlap * ratioB * longitudinalCorrection;

                        // 橫向速度
                        const lateralPush = overlap * 0.6 * cornerFactor;
                        if (!horseA.lateralSpeed) horseA.lateralSpeed = 0;
                        if (!horseB.lateralSpeed) horseB.lateralSpeed = 0;

                        horseA.lateralSpeed -= pushDirD * lateralPush * ratioA;
                        horseB.lateralSpeed += pushDirD * lateralPush * ratioB;

                        // 輕微減速
                        if (!horseA.speedDamping) horseA.speedDamping = 1.0;
                        if (!horseB.speedDamping) horseB.speedDamping = 1.0;
                        horseA.speedDamping *= (0.98 + (1 - cornerFactor) * 0.01);
                        horseB.speedDamping *= (0.98 + (1 - cornerFactor) * 0.01);
                    }

                    // 限制在賽道範圍內
                    const trackWidth = this.frenet.getTrackWidth();
                    horseA.d = Math.max(0.5, Math.min(horseA.d, trackWidth - 0.5));
                    horseB.d = Math.max(0.5, Math.min(horseB.d, trackWidth - 0.5));
                }
            }
        }
    }

    getHorseWorldPositions() {
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

    getResults() {
        return this.finishOrder.map((horse, index) => ({
            position: index + 1,
            horse: horse,
            finishTime: horse.finishTime
        }));
    }

    getRaceState() {
        return {
            isRunning: this.isRunning,
            raceTime: this.raceTime,
            raceProgress: this.calculateRaceProgress(),
            leaderboard: this.getCurrentLeaderboard()
        };
    }

    getCurrentLeaderboard() {
        const sorted = [...this.horses].sort((a, b) => b.s - a.s);
        return sorted.map((horse, index) => ({
            position: index + 1,
            horse: horse,
            distance: horse.s,
            isBoxedIn: horse.isBoxedIn,
            isOvertaking: horse.isOvertaking
        }));
    }

    getDebugInfo(horseId) {
        const horse = this.horses.find(h => h.id === horseId);
        if (!horse) return null;

        return {
            frenet: { s: horse.s, d: horse.d },
            speed: horse.speed,
            lateralSpeed: horse.lateralSpeed,
            speedDamping: horse.speedDamping,
            isBoxedIn: horse.isBoxedIn,
            isOvertaking: horse.isOvertaking,
            overtakeTarget: horse.overtakeTarget,
            anxiety: horse.anxiety,
            runningStyle: horse.runningStyle,
            cornerRadius: this.frenet.getCornerRadiusAt(horse.s),
            stamina: horse.stamina || 1.0,
            hasStarted: horse.hasStarted
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RaceSimulator;
}