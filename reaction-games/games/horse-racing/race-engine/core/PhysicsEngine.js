// ====================================
// Physics Engine (V8 - 極簡測試版)
// 目的：完全移除可能導致卡頓的因素
// ====================================

class PhysicsEngine {
    constructor(settings = {}) {
        this.CORNER_SPEED_LIMIT = settings.cornerSpeedLimit || 14;
        this.FRICTION = settings.friction || 0.999;
        this.MAX_LATERAL_SPEED = settings.maxLateralSpeed || 3.0;
        this.SPEED_SMOOTHING = settings.speedSmoothing || 0.25;
    }

    update(horse, frenetCoord, deltaTime, lateralForce) {
        // **極簡版本：移除所有複雜邏輯**

        // 1. 速度阻尼（簡化）
        if (horse.speedDamping && horse.speedDamping !== 1.0) {
            const recoveryRate = 0.2; // 快速恢復
            horse.speedDamping += (1.0 - horse.speedDamping) * recoveryRate;

            if (Math.abs(horse.speedDamping - 1.0) < 0.01) {
                horse.speedDamping = 1.0;
            }
        } else {
            horse.speedDamping = 1.0;
        }

        // 2. **直接用速度更新位置（無任何修正）**
        horse.s += horse.speed * deltaTime;

        // 3. **完全移除離心力系統**
        // 只做簡單的彎道減速
        const cornerRadius = frenetCoord.getCornerRadiusAt(horse.s);

        if (cornerRadius < 150 && horse.speed > this.CORNER_SPEED_LIMIT) {
            // 溫和減速
            horse.speed *= 0.995; // 每幀減速 0.5%
        }

        // 4. 橫向位置（簡化）
        if (!horse.lateralSpeed) horse.lateralSpeed = 0;

        horse.lateralSpeed += lateralForce * 2.0 * deltaTime;
        horse.lateralSpeed = Math.max(-this.MAX_LATERAL_SPEED,
            Math.min(this.MAX_LATERAL_SPEED, horse.lateralSpeed));

        horse.d += horse.lateralSpeed * deltaTime;
        horse.lateralSpeed *= 0.90;

        // 5. 限制在賽道範圍內
        const trackWidth = frenetCoord.getTrackWidth();
        horse.d = Math.max(0.5, Math.min(horse.d, trackWidth - 0.5));
        // horse.s = Math.max(0, Math.min(horse.s, frenetCoord.pathLength)); // REMOVED: Allow loop
        if (horse.s < 0) horse.s = 0; // Only clamp to 0

        // 6. 摩擦
        horse.speed *= this.FRICTION;
    }

    checkSlingshotOpportunity(horse, frenetCoord, allHorses) {
        // 暫時禁用
        return;
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
        // ** Deterministic Mode Protection **
        // If rank is assigned, DO NOT let strategy override the strict speed hierarchy.
        if (horse.visualRank !== undefined) {
            // For Rank 1 (Winner), purely consistent speed.
            if (horse.visualRank === 1) return;

            // For others, add very minor noise just for visual variety, 
            // but NOT enough to overcome the 0.15 speed gap.
            // Max variance +/- 0.05
            const noise = Math.sin(this.raceTime * 3 + horse.id) * 0.05;
            horse.speed += noise * 0.01;
            return;
        }

        const baseSpeed = horse.baseSpeed || 16;

        // 簡化策略
        let targetSpeed = baseSpeed;

        if (horse.runningStyle === '逃') {
            targetSpeed = raceProgress < 0.6 ? baseSpeed * 1.1 : baseSpeed * 0.9;
        } else if (horse.runningStyle === '追' || horse.runningStyle === '殿') {
            targetSpeed = raceProgress < 0.7 ? baseSpeed * 0.9 : baseSpeed * 1.15;
        }

        // 直接設定速度（無平滑）
        const speedDiff = targetSpeed - horse.speed;
        horse.speed += speedDiff * this.SPEED_SMOOTHING;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsEngine;
}