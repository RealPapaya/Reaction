// ====================================
// Steering Behaviors (V2 - 超車優先)
// 策略：降低內欄吸引，增強超車意願
// ====================================

class SteeringBehavior {
    constructor(settings = {}) {
        this.RAIL_ATTRACTION = settings.railAttraction || 0.1;  // **降低**：0.2 -> 0.1
        this.AVOIDANCE_FORCE = settings.avoidanceForce || 0.5;   // **降低**：0.65 -> 0.5
        this.SEPARATION_FORCE = settings.separationForce || 0.8; // **增強**：0.6 -> 0.8
        this.OVERTAKE_FORCE = settings.overtakeForce || 2.5;     // **大幅增強**：1.5 -> 2.5
        this.SAFE_DISTANCE = settings.safeDistance || 2.5;
        this.SENSOR_RANGE = settings.sensorRange || 12.0;        // **增加**：10.0 -> 12.0
        this.SPEED_DIFF_THRESHOLD = settings.speedDiffThreshold || 0.8; // **降低**：1.5 -> 0.8
    }

    compute(horse, allHorses, trackWidth) {
        const seekForce = this.seekInnerRail(horse, trackWidth);
        const avoidForce = this.avoidObstacle(horse, allHorses);
        const separateForce = this.separateWithPhysics(horse, allHorses);
        const overtakeForce = this.overtakeSlowerHorse(horse, allHorses);

        // **關鍵修正**：超車時幾乎忽略其他力
        let railWeight = this.RAIL_ATTRACTION;
        let avoidWeight = this.AVOIDANCE_FORCE;
        let separateWeight = this.SEPARATION_FORCE;

        if (horse.isOvertaking) {
            railWeight *= 0.05;  // **極低**：內欄吸引降低 95%
            avoidWeight *= 0.3;  // 避障力降低 70%
            separateWeight *= 0.5; // 分離力降低 50%
        }

        const totalForce =
            seekForce * railWeight +
            avoidForce * avoidWeight +
            separateForce * separateWeight +
            overtakeForce * this.OVERTAKE_FORCE;

        return totalForce;
    }

    seekInnerRail(horse, trackWidth) {
        // **降低內欄吸引力**
        const idealD = horse.preferredD || 1.0;
        const error = -(idealD - horse.d);

        // 只有偏離很遠時才施力
        if (Math.abs(horse.d - idealD) > 1.0) {
            return error * 0.3;
        }
        return error * 0.1;
    }

    avoidObstacle(horse, allHorses) {
        const sensors = this.castSensors(horse, allHorses);

        if (sensors.front.hit) {
            const blockedDistance = sensors.front.distance;

            if (blockedDistance < this.SENSOR_RANGE) {
                const leftClear = !sensors.leftFront.hit;
                const rightClear = !sensors.rightFront.hit;

                const urgency = 1.0 - (blockedDistance / this.SENSOR_RANGE);
                const avoidStrength = 0.5 + urgency * 0.5; // **降低**：0.6 + 0.6

                if (leftClear && !rightClear) {
                    return -avoidStrength;
                } else if (!leftClear && rightClear) {
                    return +avoidStrength * 1.2;
                } else if (leftClear && rightClear) {
                    return +avoidStrength;
                } else {
                    horse.isBoxedIn = true;
                    if (horse.speed > sensors.front.horse.speed) {
                        horse.speed *= 0.99;
                    }
                    return 0;
                }
            }
        }

        horse.isBoxedIn = false;
        return 0;
    }

    castSensors(horse, allHorses) {
        const result = {
            front: { hit: false, distance: Infinity, horse: null },
            leftFront: { hit: false, distance: Infinity, horse: null },
            rightFront: { hit: false, distance: Infinity, horse: null }
        };

        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = other.s - horse.s;
            const deltaD = other.d - horse.d;
            const distance = Math.sqrt(deltaS * deltaS + deltaD * deltaD);

            if (deltaS > 0 && deltaS <= this.SENSOR_RANGE) {
                if (Math.abs(deltaD) < 0.8) { // **放寬**：0.5 -> 0.8
                    if (deltaS < result.front.distance) {
                        result.front = { hit: true, distance: deltaS, horse: other };
                    }
                } else if (deltaD < -0.3 && deltaD > -2.5) { // **放寬**：-2.0 -> -2.5
                    if (deltaS < result.leftFront.distance) {
                        result.leftFront = { hit: true, distance: deltaS, horse: other };
                    }
                } else if (deltaD > 0.3 && deltaD < 2.5) { // **放寬**：2.0 -> 2.5
                    if (deltaS < result.rightFront.distance) {
                        result.rightFront = { hit: true, distance: deltaS, horse: other };
                    }
                }
            }
        }

        return result;
    }

    separateWithPhysics(horse, allHorses) {
        let force = 0;

        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = Math.abs(other.s - horse.s);
            const deltaD = other.d - horse.d;
            const distance = Math.sqrt(deltaS * deltaS + deltaD * deltaD);

            const minDistance = 1.5; // **增加**：bodyRadius 改為固定1.5米

            if (distance < this.SAFE_DISTANCE && distance > 0) {
                const normalizedDist = distance / this.SAFE_DISTANCE;
                const urgency = Math.pow(1.0 - normalizedDist, 2);
                const pushDirection = (horse.d - other.d) / distance;
                const pushStrength = 2.0 + urgency * 8.0; // **增強**：1.5 + 6.0
                force += pushDirection * pushStrength;
            }

            if (distance < minDistance && distance > 0) {
                const overlap = minDistance - distance;
                const pushDirection = (horse.d - other.d) / distance;
                const horseMass = horse.mass || 500;
                const otherMass = other.mass || 500;
                const massRatio = otherMass / (horseMass + otherMass);
                force += pushDirection * overlap * 15.0 * massRatio; // **增強**：10.0 -> 15.0
            }
        }

        return force;
    }

    // ====================================
    // **超車邏輯（增強版）**
    // ====================================

    overtakeSlowerHorse(horse, allHorses) {
        const frontHorses = this.getHorsesInFront(horse, allHorses, 10.0); // **增加範圍**：8.0 -> 10.0

        if (frontHorses.length === 0) {
            // 前方沒馬，清除超車狀態
            if (horse.isOvertaking) {
                horse.isOvertaking = false;
                horse.overtakeTarget = null;
            }
            return 0;
        }

        // 找到正前方最近的馬
        let closestFront = null;
        let minDistance = Infinity;

        for (const other of frontHorses) {
            const deltaS = other.s - horse.s;
            const deltaD = Math.abs(other.d - horse.d);

            // **放寬判斷**：3.0 -> 3.5
            if (deltaD < 3.5 && deltaS < minDistance) {
                minDistance = deltaS;
                closestFront = other;
            }
        }

        if (!closestFront) {
            return 0;
        }

        // **速度差判斷**
        const speedDiff = horse.speed - closestFront.speed;

        // **更激進的判斷**：降低閾值，增加距離範圍
        if (speedDiff > this.SPEED_DIFF_THRESHOLD && minDistance < 8.0) { // 6.0 -> 8.0

            // **優先檢查外側**
            const hasRightSpace = this.checkSpaceOnRight(horse, allHorses, 2.5); // **放寬**：3.0 -> 2.5

            if (hasRightSpace) {
                const urgency = Math.min(speedDiff / 2.0, 1.5); // **增強**：/3.0 -> /2.0, 1.0 -> 1.5
                const overtakeStrength = 3.5 * urgency; // **大幅增強**：2.5 -> 3.5

                horse.isOvertaking = true;
                horse.overtakeTarget = closestFront.id;

                return overtakeStrength;
            } else {
                // 外側沒空間，檢查內側
                const hasLeftSpace = this.checkSpaceOnLeft(horse, allHorses, 2.5);

                if (hasLeftSpace && horse.d > 1.5) { // **放寬**：2.0 -> 1.5
                    const urgency = Math.min(speedDiff / 2.0, 1.0);
                    const overtakeStrength = 1.5 * urgency; // **增強**：0.8 -> 1.5

                    horse.isOvertaking = true;
                    horse.overtakeTarget = closestFront.id;

                    return -overtakeStrength;
                }
            }
        }

        // **持續超車**
        if (horse.isOvertaking && horse.overtakeTarget) {
            const target = allHorses.find(h => h.id === horse.overtakeTarget);

            if (target) {
                // **更寬鬆的完成條件**
                if (horse.s > target.s + 3.0) { // **增加**：2.0 -> 3.0
                    horse.isOvertaking = false;
                    horse.overtakeTarget = null;
                } else {
                    // 持續施加超車力
                    const currentDirection = (horse.d > target.d) ? 1 : -1;
                    return currentDirection * 1.5; // 持續向外
                }
            } else {
                // 目標消失，結束超車
                horse.isOvertaking = false;
                horse.overtakeTarget = null;
            }
        }

        return 0;
    }

    // ====================================
    // 輔助方法
    // ====================================

    getHorsesInFront(horse, allHorses, range) {
        return allHorses.filter(other => {
            if (other === horse) return false;
            const deltaS = other.s - horse.s;
            return deltaS > 0 && deltaS <= range;
        });
    }

    checkSpaceOnRight(horse, allHorses, safeDistance) {
        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = Math.abs(other.s - horse.s);
            const deltaD = other.d - horse.d;

            // **放寬判斷**：4.0 -> 5.0
            if (deltaS < 5.0 && deltaD > 0 && deltaD < safeDistance) {
                return false;
            }
        }
        return true;
    }

    checkSpaceOnLeft(horse, allHorses, safeDistance) {
        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = Math.abs(other.s - horse.s);
            const deltaD = horse.d - other.d;

            if (deltaS < 5.0 && deltaD > 0 && deltaD < safeDistance) {
                return false;
            }
        }
        return true;
    }

    getHorsesInRange(horse, allHorses, range) {
        return allHorses.filter(other => {
            if (other === horse) return false;
            const deltaS = other.s - horse.s;
            const deltaD = other.d - horse.d;
            const distance = Math.sqrt(deltaS * deltaS + deltaD * deltaD);
            return distance <= range;
        });
    }

    isPathClear(horse, allHorses, lookAhead = 3.0) {
        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = other.s - horse.s;
            const deltaD = Math.abs(other.d - horse.d);

            if (deltaS > 0 && deltaS < lookAhead && deltaD < 1.0) {
                return false;
            }
        }
        return true;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SteeringBehavior;
}