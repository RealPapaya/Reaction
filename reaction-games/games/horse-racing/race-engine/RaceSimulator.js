// ====================================
// Race Simulator (V6 - 終極平滑版)
// 關鍵修正：
// 1. 完全移除碰撞位置修正（只用速度）
// 2. 優化速度過渡（消除停頓感）
// ====================================

class RaceSimulator {
    constructor(trackPath, horses, options = {}) {
        this.frenet = new FrenetCoordinate(trackPath, { trackWidth: options.trackWidth });
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
        const trackWidth = this.frenet.getTrackWidth();
        const horseCount = Math.max(1, this.horses.length);
        const laneSpacing = trackWidth / horseCount;

        for (let i = 0; i < this.horses.length; i++) {
            const horse = this.horses[i];

            horse.s = 0;
            horse.d = laneSpacing * (i + 0.5);
            horse.speed = 0;

            const baseFactor = 4 + (horse.competitiveFactor * 0.1);
            horse.baseSpeed = baseFactor * (0.97 + Math.random() * 0.06);

            horse.startDelay = Math.random() * 0.3;
            horse.hasStarted = false;

            horse.anxiety = 0;
            horse.isBoxedIn = false;
            horse.lateralSpeed = 0;

            horse.isOvertaking = false;
            horse.overtakeTarget = null;
            horse.speedDamping = 1.0;

            horse.bodyRadius = 1.0;

            if (horse.runningStyle === '逃') {
                horse.preferredD = 0.6 + Math.random() * 0.8;
            } else if (horse.runningStyle === '前') {
                horse.preferredD = 1.2 + Math.random() * 1.2;
            } else if (horse.runningStyle === '追' || horse.runningStyle === '殿') {
                horse.preferredD = 2.0 + Math.random() * 2.0;
            } else {
                horse.preferredD = 1.0 + Math.random() * 2.5;
            }

            horse.mass = 440 + Math.random() * 60;

            horse.finished = false;
            horse.finishTime = null;
            horse.positionHistory = [];

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
            horse.hasStarted = false;
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

            if (!horse.hasStarted) {
                if (this.raceTime >= horse.startDelay) {
                    horse.hasStarted = true;
                } else {
                    continue;
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

        // **碰撞解決（V6 - 純速度版）**
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
    // **碰撞解決（V6 - 純速度調整，零位置修正）**
    // ====================================

    resolveCollisions() {
        for (let i = 0; i < this.horses.length; i++) {
            for (let j = i + 1; j < this.horses.length; j++) {
                const horseA = this.horses[i];
                const horseB = this.horses[j];

                if (horseA.finished || horseB.finished) continue;
                if (!horseA.hasStarted || !horseB.hasStarted) continue;

                const deltaS = horseB.s - horseA.s;
                const deltaD = horseB.d - horseA.d;
                const distance = Math.sqrt(deltaS * deltaS + deltaD * deltaD);

                const minDistance = 2.0;

                if (distance < minDistance && distance > 0.01) {
                    const overlap = minDistance - distance;

                    const pushDirD = deltaD / distance;
                    const pushDirS = deltaS / distance;

                    const isDirectCollision = Math.abs(deltaD) < 1.5;

                    // **關鍵修正：完全移除位置修正，只用速度**

                    if (isDirectCollision) {
                        // **同跑道碰撞：純速度調整**

                        // 後方馬減速（更溫和）
                        const speedReduction = 0.08; // **降低** 0.20 -> 0.08

                        if (deltaS > 0) {
                            // B 在 A 後方
                            if (!horseB.speedDamping) horseB.speedDamping = 1.0;
                            horseB.speedDamping *= (1.0 - speedReduction);
                        } else {
                            // A 在 B 後方
                            if (!horseA.speedDamping) horseA.speedDamping = 1.0;
                            horseA.speedDamping *= (1.0 - speedReduction);
                        }

                        // **橫向速度推開（非常輕微）**
                        const lateralPush = overlap * 0.15; // **降低** 0.2 -> 0.15
                        if (!horseA.lateralSpeed) horseA.lateralSpeed = 0;
                        if (!horseB.lateralSpeed) horseB.lateralSpeed = 0;

                        horseA.lateralSpeed -= pushDirD * lateralPush;
                        horseB.lateralSpeed += pushDirD * lateralPush;

                    } else {
                        // **側面碰撞：橫向速度推開**

                        const lateralPush = overlap * 0.4; // **降低** 0.6 -> 0.4
                        if (!horseA.lateralSpeed) horseA.lateralSpeed = 0;
                        if (!horseB.lateralSpeed) horseB.lateralSpeed = 0;

                        horseA.lateralSpeed -= pushDirD * lateralPush;
                        horseB.lateralSpeed += pushDirD * lateralPush;

                        // 輕微減速
                        if (!horseA.speedDamping) horseA.speedDamping = 1.0;
                        if (!horseB.speedDamping) horseB.speedDamping = 1.0;
                        horseA.speedDamping *= 0.98;
                        horseB.speedDamping *= 0.98;
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
