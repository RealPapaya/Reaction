// ====================================
// Steering Behaviors
// 實作馬匹的轉向行為：內欄吸引、避障、分離
// ====================================

class SteeringBehavior {
    constructor(settings = {}) {
        // 可調參數（降低內欄吸引，增強避障）
        this.RAIL_ATTRACTION = settings.railAttraction || 0.15;  // 從 0.3 降到 0.15
        this.AVOIDANCE_FORCE = settings.avoidanceForce || 0.65;   // 從 0.5 升到 0.65
        this.SEPARATION_FORCE = settings.separationForce || 0.6;  // 從 0.2 大幅增加到 0.6
        this.SAFE_DISTANCE = settings.safeDistance || 2.5; // 從 2.0 增加到 2.5
        this.SENSOR_RANGE = settings.sensorRange || 8.0;   // 從 5.0 增加到 8.0
    }

    // ====================================
    // 主要計算方法
    // ====================================

    compute(horse, allHorses, trackWidth) {
        // 整合所有轉向力
        const seekForce = this.seekPreferredLane(horse, trackWidth);
        const avoidForce = this.avoidObstacle(horse, allHorses);
        const separateForce = this.separateWithPhysics(horse, allHorses);

        // 加權合成
        const totalForce =
            seekForce * this.RAIL_ATTRACTION +
            avoidForce * this.AVOIDANCE_FORCE +
            separateForce * this.SEPARATION_FORCE;

        return totalForce;
    }

    // ====================================
    // 1. 偏好跑道吸引力 (Seek Preferred Lane)
    // ====================================

    seekPreferredLane(horse, trackWidth) {
        // 目標：尋求偏好跑道（而非固定內欄）
        const targetD = horse.preferredD || 1.5; // 使用偏好跑道
        const error = targetD - horse.d;

        // 簡單的比例控制
        return error;
    }

    // ====================================
    // 2. 避障力 (Obstacle Avoidance)
    // ====================================

    avoidObstacle(horse, allHorses) {
        // 使用三個感測器：正前方、左前方、右前方
        const sensors = this.castSensors(horse, allHorses);

        // 如果前方有慢馬
        if (sensors.front.hit && sensors.front.horse.speed < horse.speed) {
            const blockedDistance = sensors.front.distance;

            // 距離越近，反應越強烈
            if (blockedDistance < this.SENSOR_RANGE) {
                // 檢查哪邊有空間
                const leftClear = !sensors.leftFront.hit;
                const rightClear = !sensors.rightFront.hit;

                if (leftClear && !rightClear) {
                    // 只有左側（內側）有空間
                    return -0.8; // 向內切
                } else if (!leftClear && rightClear) {
                    // 只有右側（外側）有空間
                    return +1.2; // 強烈向外拉
                } else if (leftClear && rightClear) {
                    // 兩側都有空間，優先選外側（避免擁擠）
                    return +0.8; // 選擇外側
                } else {
                    // 被困住！兩側都沒空間
                    horse.isBoxedIn = true;
                    horse.speed *= 0.95; // 減速
                    return 0;
                }
            }
        }

        horse.isBoxedIn = false;
        return 0;
    }

    castSensors(horse, allHorses) {
        // 投射三個感測器
        const result = {
            front: { hit: false, distance: Infinity, horse: null },
            leftFront: { hit: false, distance: Infinity, horse: null },
            rightFront: { hit: false, distance: Infinity, horse: null }
        };

        for (const other of allHorses) {
            if (other === horse) continue;

            // 計算相對位置
            const deltaS = other.s - horse.s;
            const deltaD = other.d - horse.d;
            const distance = Math.sqrt(deltaS * deltaS + deltaD * deltaD);

            // 只檢測前方的馬
            if (deltaS > 0 && deltaS <= this.SENSOR_RANGE) {
                // 正前方（±0.5米範圍）
                if (Math.abs(deltaD) < 0.5) {
                    if (deltaS < result.front.distance) {
                        result.front = { hit: true, distance: deltaS, horse: other };
                    }
                }
                // 左前方（內側）
                else if (deltaD < -0.3 && deltaD > -2.0) {
                    if (deltaS < result.leftFront.distance) {
                        result.leftFront = { hit: true, distance: deltaS, horse: other };
                    }
                }
                // 右前方（外側）
                else if (deltaD > 0.3 && deltaD < 2.0) {
                    if (deltaS < result.rightFront.distance) {
                        result.rightFront = { hit: true, distance: deltaS, horse: other };
                    }
                }
            }
        }

        return result;
    }

    // ====================================
    // 3. 指數級分離力 + 剛體推擠 (Exponential Separation + Rigid Body)
    // ====================================

    separateWithPhysics(horse, allHorses) {
        let force = 0;

        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = Math.abs(other.s - horse.s);
            const deltaD = other.d - horse.d;
            const distance = Math.sqrt(deltaS * deltaS + deltaD * deltaD);

            // 剛體半徑和
            const minDistance = (horse.bodyRadius || 0.6) + (other.bodyRadius || 0.6);

            // 如果距離太近（在安全距離內）
            if (distance < this.SAFE_DISTANCE && distance > 0) {
                // **指數級增長**：距離越近，力越強
                const normalizedDist = distance / this.SAFE_DISTANCE; // 0-1
                const urgency = Math.pow(1.0 - normalizedDist, 2); // 平方增長

                // 方向：推開
                const pushDirection = (horse.d - other.d) / distance;

                // 力度：基礎為 2.0，緊急時最高 10.0
                const pushStrength = 2.0 + urgency * 8.0;

                force += pushDirection * pushStrength;
            }

            // **剛體碰撞**：如果重疊了，強制推開
            if (distance < minDistance && distance > 0) {
                const overlap = minDistance - distance;
                const pushDirection = (horse.d - other.d) / distance;

                // 根據質量比例推擠
                const horseMass = horse.mass || 500;
                const otherMass = other.mass || 500;
                const massRatio = otherMass / (horseMass + otherMass);

                // 質量較大的馬像推土機，位移較小
                force += pushDirection * overlap * 15.0 * massRatio;
            }
        }

        return force;
    }

    // ====================================
    // 輔助方法
    // ====================================

    getHorsesInRange(horse, allHorses, range) {
        // 返回指定範圍內的所有馬匹
        return allHorses.filter(other => {
            if (other === horse) return false;
            const deltaS = other.s - horse.s;
            const deltaD = other.d - horse.d;
            const distance = Math.sqrt(deltaS * deltaS + deltaD * deltaD);
            return distance <= range;
        });
    }

    isPathClear(horse, allHorses, lookAhead = 3.0) {
        // 檢查前方是否暢通
        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = other.s - horse.s;
            const deltaD = Math.abs(other.d - horse.d);

            if (deltaS > 0 && deltaS < lookAhead && deltaD < 1.0) {
                return false; // 前方有馬
            }
        }
        return true;
    }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SteeringBehavior;
}
