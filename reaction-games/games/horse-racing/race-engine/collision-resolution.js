// ====================================
// 碰撞解決（V2 - 混合策略）
// 策略：輕微位置修正 + 速度調整
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

            // **關鍵修正**：使用更大的碰撞體積（接近視覺尺寸）
            const minDistance = 1.5; // 固定 1.5 米（視覺是 2.0m，留點空隙）

            if (distance < minDistance && distance > 0.01) {
                const overlap = minDistance - distance;

                // 計算推開方向
                const pushDirD = deltaD / distance;
                const pushDirS = deltaS / distance;

                // 質量比例
                const massA = horseA.mass || 500;
                const massB = horseB.mass || 500;
                const totalMass = massA + massB;
                const ratioA = massB / totalMass;
                const ratioB = massA / totalMass;

                const isDirectCollision = Math.abs(deltaD) < 1.5;

                if (isDirectCollision) {
                    // **同跑道碰撞**

                    // **混合策略 1：輕微的即時位置修正（30%）**
                    const positionCorrection = 0.3;
                    horseA.s -= pushDirS * overlap * ratioA * positionCorrection;
                    horseB.s += pushDirS * overlap * ratioB * positionCorrection;
                    horseA.d -= pushDirD * overlap * ratioA * positionCorrection;
                    horseB.d += pushDirD * overlap * ratioB * positionCorrection;

                    // **混合策略 2：速度調整（70%）**
                    const speedCorrection = 0.25; // 增強

                    if (deltaS > 0) {
                        // B 在 A 後方
                        if (!horseB.speedDamping) horseB.speedDamping = 1.0;
                        horseB.speedDamping *= (1.0 - speedCorrection);
                    } else {
                        if (!horseA.speedDamping) horseA.speedDamping = 1.0;
                        horseA.speedDamping *= (1.0 - speedCorrection);
                    }

                    // 橫向速度推開
                    const lateralPush = overlap * 0.4; // 增強
                    if (!horseA.lateralSpeed) horseA.lateralSpeed = 0;
                    if (!horseB.lateralSpeed) horseB.lateralSpeed = 0;

                    horseA.lateralSpeed -= pushDirD * lateralPush * ratioA;
                    horseB.lateralSpeed += pushDirD * lateralPush * ratioB;

                } else {
                    // **側面碰撞**

                    // 位置修正（50%）
                    const positionCorrection = 0.5;
                    horseA.d -= pushDirD * overlap * ratioA * positionCorrection;
                    horseB.d += pushDirD * overlap * ratioB * positionCorrection;

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