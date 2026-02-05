// ====================================
// Physics Engine
// 處理賽馬的物理計算：速度、加速度、彎道效應
// ====================================

class PhysicsEngine {
    constructor(settings = {}) {
        this.CORNER_SPEED_LIMIT = settings.cornerSpeedLimit || 14; // 米/秒
        this.CENTRIFUGAL_STRENGTH = settings.centrifugalStrength || 0.1;
        this.FRICTION = settings.friction || 0.98;
        this.MAX_LATERAL_SPEED = settings.maxLateralSpeed || 2.0; // 最大橫向速度
    }

    // ====================================
    // 主要更新方法
    // ====================================

    update(horse, frenetCoord, deltaTime, lateralForce) {
        // 1. 更新縱向位置（沿著賽道前進）
        const actualDistance = this.calculateActualDistance(
            horse,
            frenetCoord,
            deltaTime
        );
        horse.s += actualDistance;

        // 2. 處理彎道物理
        this.applyCentrifugalForce(horse, frenetCoord);

        // 3. 更新橫向位置（根據轉向力）
        this.updateLateralPosition(horse, lateralForce, deltaTime, frenetCoord);

        // 4. 限制在賽道範圍內
        this.constrainToTrack(horse, frenetCoord);

        // 5. 速度衰減（輕微）
        horse.speed *= this.FRICTION;
    }

    // ====================================
    // 彎道物理
    // ====================================

    calculateActualDistance(horse, frenetCoord, deltaTime) {
        // 計算實際跑的距離（考慮彎道外側要多跑）
        const nominalDistance = horse.speed * deltaTime;
        const currentS = horse.s;
        const nextS = currentS + nominalDistance;

        // 獲取這段路徑的實際距離
        const actualDist = frenetCoord.getActualDistance(
            currentS,
            nextS,
            horse.d
        );

        return actualDist;
    }

    applyCentrifugalForce(horse, frenetCoord) {
        // 彎道時的離心力效應
        const cornerRadius = frenetCoord.getCornerRadiusAt(horse.s);

        if (cornerRadius < Infinity) {
            // 在彎道中
            const centrifugal = (horse.speed * horse.speed) / cornerRadius;

            // 根據速度，推向外側
            const pushOutward = centrifugal * this.CENTRIFUGAL_STRENGTH;
            horse.d += pushOutward * 0.016; // 假設 60fps，約 0.016秒/幀

            // 如果速度太快，強制減速
            if (horse.speed > this.CORNER_SPEED_LIMIT) {
                horse.speed *= 0.98; // 輕微減速
            }
        }
    }

    // ====================================
    // 橫向移動
    // ====================================

    updateLateralPosition(horse, lateralForce, deltaTime, frenetCoord) {
        // 橫向力轉換為橫向速度變化
        const lateralAcceleration = lateralForce * 2.0; // 加速度係數

        // 更新橫向速度
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

        // 阻尼（減少震盪）
        horse.lateralSpeed *= 0.9;
    }

    constrainToTrack(horse, frenetCoord) {
        // 確保馬匹不會跑出賽道
        const trackWidth = frenetCoord.getTrackWidth();
        const minD = 0.5; // 最內側（留出安全距離）
        const maxD = trackWidth - 0.5; // 最外側

        if (horse.d < minD) {
            horse.d = minD;
            horse.lateralSpeed = Math.max(0, horse.lateralSpeed); // 停止向內
        } else if (horse.d > maxD) {
            horse.d = maxD;
            horse.lateralSpeed = Math.min(0, horse.lateralSpeed); // 停止向外
        }

        // 限制 s 在有效範圍
        horse.s = Math.max(0, Math.min(horse.s, frenetCoord.pathLength));
    }

    // ====================================
    // Slingshot 效應（彈射效應）
    // ====================================

    checkSlingshotOpportunity(horse, frenetCoord, allHorses) {
        // 檢查是否剛出彎道，且外側有空間
        const cornerRadius = frenetCoord.getCornerRadiusAt(horse.s);
        const wasInCorner = horse.lastCornerRadius && horse.lastCornerRadius < Infinity;
        const nowStraight = cornerRadius === Infinity;

        if (wasInCorner && nowStraight) {
            // 剛出彎！
            const hasOutsideSpace = this.hasSpaceOnRight(horse, allHorses);

            if (hasOutsideSpace && horse.runningStyle === '追' || horse.runningStyle === '殿') {
                // 追馬/殿腳可以利用外側空間加速
                horse.speed *= 1.05; // 短暫加速5%
                horse.slingshotBoost = true;
            }
        }

        horse.lastCornerRadius = cornerRadius;
    }

    hasSpaceOnRight(horse, allHorses) {
        // 檢查右側（外側）是否有空間
        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = Math.abs(other.s - horse.s);
            const deltaD = other.d - horse.d;

            // 右側有馬且很近
            if (deltaS < 3.0 && deltaD > 0 && deltaD < 2.0) {
                return false;
            }
        }
        return true;
    }

    // ====================================
    // 速度管理
    // ====================================

    applyStrategySpeed(horse, raceProgress) {
        // 根據腳質和比賽進度調整目標速度
        const baseSpeed = horse.baseSpeed || 16; // 基礎速度（米/秒）

        if (horse.runningStyle === '逃') {
            // 逃馬：前半段全力，後半段降速
            if (raceProgress < 0.6) {
                horse.targetSpeed = baseSpeed * 1.1;
            } else {
                horse.targetSpeed = baseSpeed * 0.9;
            }
        } else if (horse.runningStyle === '前') {
            // 前腳：穩定速度
            horse.targetSpeed = baseSpeed;
        } else if (horse.runningStyle === '追' || horse.runningStyle === '殿') {
            // 追馬/殿腳：前半段保留，後半段衝刺
            if (raceProgress < 0.7) {
                horse.targetSpeed = baseSpeed * 0.9;
            } else {
                horse.targetSpeed = baseSpeed * 1.15;
            }
        }

        // 平滑過渡到目標速度
        const speedDiff = horse.targetSpeed - horse.speed;
        horse.speed += speedDiff * 0.05; // 5% 每幀
    }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsEngine;
}
