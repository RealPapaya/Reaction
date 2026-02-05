// ====================================
// Race Simulator (V3 - 增強前後分離)
// 關鍵修正：
// 1. 彎道使用速度而非位置
// 2. 大幅增強縱向（前後）分離
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

    initializeHorses() {
        for (let i = 0; i < this.horses.length; i++) {
            const horse = this.horses[i];

            horse.s = -i * 0.5;
            horse.d = 1.0 + (i * 2.0);
            horse.speed = 0;

            horse.baseSpeed = 8 + (horse.competitiveFactor * 0.1);

            horse.anxiety = 0;
            horse.isBoxedIn = false;
            horse.lateralSpeed = 0;

            horse.isOvertaking = false;
            horse.overtakeTarget = null;
            horse.speedDamping = 1.0;

            horse.bodyRadius = 1.0;

            if (horse.runningStyle === '逃') {
                horse.preferredD = 0.8 + Math.random() * 0.5;
            } else if (horse.runningStyle === '前') {
                horse.preferredD = 1.5 + Math.random() * 1.0;
            } else if (horse.runningStyle === '追' || horse.runningStyle === '殿') {
                horse.preferredD = 2.5 + Math.random() * 1.5;
            } else {
                horse.preferredD = 1.0 + Math.random() * 2.0;
            }

            horse.mass = 450 + Math.random() * 50;
            horse.finished = false;
            horse.finishTime = null;
            horse.positionHistory = [];
        }
    }

    startRace() {
        this.isRunning = true;
        this.raceTime = 0;
        this.finishOrder = [];
        this.lastUpdateTime = performance.now();

        this.horses.forEach(horse => {
            horse.speed = horse.baseSpeed * 0.8;
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

        // **碰撞解決（V3版本 - 增強前後分離）**
        this.resolveCollisions();

        if (this.finishOrder.length === this.horses.length) {
            this.isRunning = false;
        }
    }

    calculateRaceProgress() {
        let maxS = 0;
        for (const horse of this.horses) {
            maxS = Math.max(maxS, horse.s);
        }
        return maxS / this.frenet.pathLength;
    }

    // ====================================
    // 碰撞解決（V3 - 增強前後分離）
    // ====================================

    resolveCollisions() {
        for (let i = 0; i < this.horses.length; i++) {
            for (let j = i + 1; j < this.horses.length; j++) {
                const horseA = this.horses[i];
                const horseB = this.horses[j];

                if (horseA.finished || horseB.finished) continue;

                const deltaS = horseB.s - horseA.s;
                const deltaD = horseB.d - horseA.d;
                const distance = Math.sqrt(deltaS * deltaS + deltaD * deltaD);

                // **安全距離：2.0米**（視覺尺寸）
                const minDistance = 2.0; // **增加** 1.8 -> 2.0

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

                    if (isDirectCollision) {
                        // **同跑道碰撞：大幅增強縱向分離**

                        // **1. 縱向位置修正（60%）** - **增強** 30% -> 60%
                        const longitudinalCorrection = 0.6;
                        horseA.s -= pushDirS * overlap * ratioA * longitudinalCorrection;
                        horseB.s += pushDirS * overlap * ratioB * longitudinalCorrection;

                        // **2. 橫向位置修正（20%）** - 降低，避免干擾
                        const lateralCorrection = 0.2;
                        horseA.d -= pushDirD * overlap * ratioA * lateralCorrection;
                        horseB.d += pushDirD * overlap * ratioB * lateralCorrection;

                        // **3. 速度調整（更強）**
                        const speedCorrection = 0.35; // **增強** 0.25 -> 0.35

                        if (deltaS > 0) {
                            // B 在 A 後方，B 強制減速
                            if (!horseB.speedDamping) horseB.speedDamping = 1.0;
                            horseB.speedDamping *= (1.0 - speedCorrection);

                            // **如果重疊嚴重，直接降速**
                            if (overlap > minDistance * 0.5) {
                                horseB.speed *= 0.95; // 立即降速5%
                            }
                        } else {
                            // A 在 B 後方，A 強制減速
                            if (!horseA.speedDamping) horseA.speedDamping = 1.0;
                            horseA.speedDamping *= (1.0 - speedCorrection);

                            if (overlap > minDistance * 0.5) {
                                horseA.speed *= 0.95;
                            }
                        }

                        // **4. 橫向速度推開（輕微）**
                        const lateralPush = overlap * 0.3; // **降低** 0.4 -> 0.3
                        if (!horseA.lateralSpeed) horseA.lateralSpeed = 0;
                        if (!horseB.lateralSpeed) horseB.lateralSpeed = 0;

                        horseA.lateralSpeed -= pushDirD * lateralPush * ratioA;
                        horseB.lateralSpeed += pushDirD * lateralPush * ratioB;

                    } else {
                        // **側面碰撞：主要橫向分離**

                        // 橫向位置修正（60%）
                        const lateralCorrection = 0.6;
                        horseA.d -= pushDirD * overlap * ratioA * lateralCorrection;
                        horseB.d += pushDirD * overlap * ratioB * lateralCorrection;

                        // 縱向位置修正（20%）
                        const longitudinalCorrection = 0.2;
                        horseA.s -= pushDirS * overlap * ratioA * longitudinalCorrection;
                        horseB.s += pushDirS * overlap * ratioB * longitudinalCorrection;

                        // 橫向速度
                        const lateralPush = overlap * 0.6;
                        if (!horseA.lateralSpeed) horseA.lateralSpeed = 0;
                        if (!horseB.lateralSpeed) horseB.lateralSpeed = 0;

                        horseA.lateralSpeed -= pushDirD * lateralPush * ratioA;
                        horseB.lateralSpeed += pushDirD * lateralPush * ratioB;

                        // 輕微減速
                        if (!horseA.speedDamping) horseA.speedDamping = 1.0;
                        if (!horseB.speedDamping) horseB.speedDamping = 1.0;
                        horseA.speedDamping *= 0.97;
                        horseB.speedDamping *= 0.97;
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
            cornerRadius: this.frenet.getCornerRadiusAt(horse.s)
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RaceSimulator;
}