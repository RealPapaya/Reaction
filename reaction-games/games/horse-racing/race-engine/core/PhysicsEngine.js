// ====================================
// Physics Engine (V3 - 修正彎道卡頓)
// 關鍵修正：離心力使用速度而非直接改位置
// ====================================

class PhysicsEngine {
    constructor(settings = {}) {
        this.CORNER_SPEED_LIMIT = settings.cornerSpeedLimit || 14;
        this.CENTRIFUGAL_STRENGTH = settings.centrifugalStrength || 0.15; // **增強** 0.1 -> 0.15
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

        // 2. 處理彎道物理（**修正版**）
        this.applyCentrifugalForce(horse, frenetCoord, deltaTime);

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
    // **關鍵修正：彎道物理使用速度**
    // ====================================
    applyCentrifugalForce(horse, frenetCoord, deltaTime) {
        const cornerRadius = frenetCoord.getCornerRadiusAt(horse.s);

        if (cornerRadius < Infinity) {
            // 計算離心力
            const centrifugal = (horse.speed * horse.speed) / cornerRadius;

            // **修正：不直接改位置，而是增加橫向速度**
            const centrifugalForce = centrifugal * this.CENTRIFUGAL_STRENGTH;

            // 將離心力轉換為橫向加速度
            if (!horse.lateralSpeed) horse.lateralSpeed = 0;
            horse.lateralSpeed += centrifugalForce * deltaTime * 10; // 轉換係數

            // 限制橫向速度（避免過快）
            horse.lateralSpeed = Math.min(horse.lateralSpeed, this.MAX_LATERAL_SPEED);

            // 如果速度太快，減速
            if (horse.speed > this.CORNER_SPEED_LIMIT) {
                if (!horse.speedDamping) horse.speedDamping = 1.0;
                horse.speedDamping *= 0.97;
            }
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

        horse.lastCornerRadius = cornerRadius;
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

    applyStrategySpeed(horse, raceProgress) {
        const baseSpeed = horse.baseSpeed || 16;

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

        const speedDiff = targetSpeed - horse.speed;
        horse.speed += speedDiff * this.SPEED_SMOOTHING;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsEngine;
}