// ====================================
// Physics Engine (V4 - 修正彎道卡頓)
// 關鍵修正：
// 1. 平滑曲率變化 (解決跳變)
// 2. 降低離心力強度
// 3. 添加體力系統 (增加隨機性)
// ====================================

class PhysicsEngine {
    constructor(settings = {}) {
        this.CORNER_SPEED_LIMIT = settings.cornerSpeedLimit || 14;
        this.CENTRIFUGAL_STRENGTH = settings.centrifugalStrength || 0.10; // **降低** 0.15 -> 0.10
        this.FRICTION = settings.friction || 0.998;
        this.MAX_LATERAL_SPEED = settings.maxLateralSpeed || 3.0;
        this.SPEED_SMOOTHING = settings.speedSmoothing || 0.2;
    }

    update(horse, frenetCoord, deltaTime, lateralForce) {
        // 0. 應用速度阻尼
        this.applySpeedDamping(horse, deltaTime);

        // 1. 更新縱向位置
        const actualDistance = this.calculateActualDistance(
            horse,
            frenetCoord,
            deltaTime
        );
        horse.s += actualDistance;

        // 2. 處理彎道物理（**修正版 - 平滑曲率**）
        this.applyCentrifugalForceSmooth(horse, frenetCoord, deltaTime);

        // 3. 更新橫向位置
        this.updateLateralPosition(horse, lateralForce, deltaTime, frenetCoord);

        // 4. 限制在賽道範圍內
        this.constrainToTrack(horse, frenetCoord);

        // 5. 速度衰減
        horse.speed *= this.FRICTION;
    }

    applySpeedDamping(horse, deltaTime) {
        if (horse.speedDamping !== undefined) {
            const targetSpeed = horse.speed * horse.speedDamping;
            const speedDiff = targetSpeed - horse.speed;
            horse.speed += speedDiff * this.SPEED_SMOOTHING;

            horse.speedDamping += (1.0 - horse.speedDamping) * 0.1;

            if (Math.abs(horse.speedDamping - 1.0) < 0.02) {
                horse.speedDamping = 1.0;
            }
        } else {
            horse.speedDamping = 1.0;
        }
    }

    calculateActualDistance(horse, frenetCoord, deltaTime) {
        const nominalDistance = horse.speed * deltaTime;
        const currentS = horse.s;
        const nextS = currentS + nominalDistance;
        const actualDist = frenetCoord.getActualDistance(
            currentS,
            nextS,
            horse.d
        );
        return actualDist;
    }

    // ====================================
    // **關鍵修正：平滑曲率變化 + 離心力衰減**
    // ====================================
    applyCentrifugalForceSmooth(horse, frenetCoord, deltaTime) {
        const cornerRadius = frenetCoord.getCornerRadiusAt(horse.s);

        // **初始化上一幀曲率**
        if (horse.lastCornerRadius === undefined) {
            horse.lastCornerRadius = cornerRadius;
        }

        // **平滑曲率過渡**（關鍵修正）
        const SMOOTH_FACTOR = 0.1; // 每幀只改變 10%
        let smoothRadius;

        if (cornerRadius === Infinity) {
            // 目標是直線
            if (horse.lastCornerRadius === Infinity) {
                smoothRadius = Infinity;
            } else {
                // 離開彎道：逐漸增大半徑直到無限
                smoothRadius = horse.lastCornerRadius * (1 + SMOOTH_FACTOR * 2);
                if (smoothRadius > 1000) {
                    smoothRadius = Infinity;
                }
            }
        } else {
            // 目標是彎道
            if (horse.lastCornerRadius === Infinity) {
                // 進入彎道：從大半徑開始
                smoothRadius = Math.max(cornerRadius * 3, 300);
            } else {
                // 彎道內：平滑過渡
                const diff = cornerRadius - horse.lastCornerRadius;
                smoothRadius = horse.lastCornerRadius + diff * SMOOTH_FACTOR;
            }
        }

        // **更新記錄**
        horse.lastCornerRadius = smoothRadius;

        // **計算離心力**
        if (smoothRadius < Infinity) {
            // 在彎道中
            const centrifugal = (horse.speed * horse.speed) / smoothRadius;
            const targetLateralSpeed = centrifugal * this.CENTRIFUGAL_STRENGTH * 4;

            // **平滑過渡到目標橫向速度**（而非累積）
            if (!horse.lateralSpeed) horse.lateralSpeed = 0;

            const lateralDiff = targetLateralSpeed - horse.lateralSpeed;
            horse.lateralSpeed += lateralDiff * 0.3; // 30% 混合

            // 限制橫向速度
            horse.lateralSpeed = Math.min(horse.lateralSpeed, this.MAX_LATERAL_SPEED);

            // 彎道減速
            if (horse.speed > this.CORNER_SPEED_LIMIT) {
                if (!horse.speedDamping) horse.speedDamping = 1.0;
                horse.speedDamping *= 0.98;
            }
        } else {
            // **離開彎道：快速衰減橫向速度**（關鍵修正）
            if (!horse.lateralSpeed) horse.lateralSpeed = 0;
            horse.lateralSpeed *= 0.85; // 每幀衰減 15%
        }
    }

    updateLateralPosition(horse, lateralForce, deltaTime, frenetCoord) {
        const lateralAcceleration = lateralForce * 3.0;

        if (!horse.lateralSpeed) {
            horse.lateralSpeed = 0;
        }

        horse.lateralSpeed += lateralAcceleration * deltaTime;

        // 限制橫向速度
        horse.lateralSpeed = Math.max(
            -this.MAX_LATERAL_SPEED,
            Math.min(this.MAX_LATERAL_SPEED, horse.lateralSpeed)
        );

        // 更新橫向位置
        horse.d += horse.lateralSpeed * deltaTime;

        // 阻尼
        horse.lateralSpeed *= 0.90;
    }

    constrainToTrack(horse, frenetCoord) {
        const trackWidth = frenetCoord.getTrackWidth();
        const minD = 0.5;
        const maxD = trackWidth - 0.5;

        if (horse.d < minD) {
            horse.d = minD;
            horse.lateralSpeed = Math.max(0, horse.lateralSpeed);
        } else if (horse.d > maxD) {
            horse.d = maxD;
            horse.lateralSpeed = Math.min(0, horse.lateralSpeed);
        }

        horse.s = Math.max(0, Math.min(horse.s, frenetCoord.pathLength));
    }

    checkSlingshotOpportunity(horse, frenetCoord, allHorses) {
        const cornerRadius = frenetCoord.getCornerRadiusAt(horse.s);
        const wasInCorner = horse.lastCornerRadius && horse.lastCornerRadius < Infinity;
        const nowStraight = cornerRadius === Infinity;

        if (wasInCorner && nowStraight) {
            const hasOutsideSpace = this.hasSpaceOnRight(horse, allHorses);

            if (hasOutsideSpace && (horse.runningStyle === '追' || horse.runningStyle === '殿')) {
                if (!horse.speedDamping) horse.speedDamping = 1.0;
                horse.speedDamping = 1.05;
                horse.slingshotBoost = true;
            }
        }
    }

    hasSpaceOnRight(horse, allHorses) {
        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = Math.abs(other.s - horse.s);
            const deltaD = other.d - horse.d;

            if (deltaS < 3.0 && deltaD > 0 && deltaD < 2.0) {
                return false;
            }
        }
        return true;
    }

    // ====================================
    // **新增：體力系統 (增加隨機性)**
    // ====================================
    applyStrategySpeed(horse, raceProgress) {
        const baseSpeed = horse.baseSpeed || 16;

        // **初始化體力系統**
        if (!horse.stamina) {
            horse.stamina = 0.95 + Math.random() * 0.1; // 95%-105%
            horse.staminaDecayRate = 0.015 + Math.random() * 0.01; // 1.5%-2.5%
            horse.lastStaminaUpdate = 0;
        }

        // **體力衰減** (每秒更新一次)
        const timeSinceUpdate = raceProgress - horse.lastStaminaUpdate;
        if (timeSinceUpdate > 0.01) { // 約每 0.01 進度更新
            horse.stamina -= horse.staminaDecayRate * timeSinceUpdate;
            horse.stamina = Math.max(0.70, horse.stamina); // 最低 70%
            horse.lastStaminaUpdate = raceProgress;
        }

        // **微小隨機波動** (模擬馬匹狀態起伏)
        const randomFactor = 0.98 + Math.random() * 0.04; // ±2%

        let targetSpeed;

        if (horse.runningStyle === '逃') {
            if (raceProgress < 0.6) {
                targetSpeed = baseSpeed * 1.1;
            } else {
                targetSpeed = baseSpeed * 0.9;
            }
        } else if (horse.runningStyle === '前') {
            targetSpeed = baseSpeed;
        } else if (horse.runningStyle === '追' || horse.runningStyle === '殿') {
            if (raceProgress < 0.7) {
                targetSpeed = baseSpeed * 0.9;
            } else {
                targetSpeed = baseSpeed * 1.15;
            }
        } else {
            targetSpeed = baseSpeed;
        }

        // **應用體力和隨機因素**
        targetSpeed *= horse.stamina * randomFactor;

        const speedDiff = targetSpeed - horse.speed;
        horse.speed += speedDiff * this.SPEED_SMOOTHING;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsEngine;
}