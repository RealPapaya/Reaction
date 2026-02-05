// ====================================
// 碰撞解決（位置衝量修正）
// ====================================

resolveCollisions() {
    // 檢查所有馬匹對，如果重疊則強制分開
    for (let i = 0; i < this.horses.length; i++) {
        for (let j = i + 1; j < this.horses.length; j++) {
            const horseA = this.horses[i];
            const horseB = this.horses[j];

            if (horseA.finished || horseB.finished) continue;

            const deltaS = horseB.s - horseA.s;
            const deltaD = horseB.d - horseA.d;
            const distance = Math.sqrt(deltaS * deltaS + deltaD * deltaD);

            const minDistance = (horseA.bodyRadius || 0.6) + (horseB.bodyRadius || 0.6);

            // 如果重疊了
            if (distance < minDistance && distance > 0) {
                const overlap = minDistance - distance;

                // 計算推開方向（單位向量）
                const pushDirD = deltaD / distance;
                const pushDirS = deltaS / distance;

                // 根據質量比例分配位移
                const massA = horseA.mass || 500;
                const massB = horseB.mass || 500;
                const totalMass = massA + massB;

                const ratioA = massB / totalMass;  // 質量大的馬移動少
                const ratioB = massA / totalMass;

                // **橫向距離判斷**：如果橫向距離很近（在同一跑道）
                const isDirectCollision = Math.abs(deltaD) < 1.5;

                if (isDirectCollision) {
                    // **同跑道碰撞**：主要修正縱向，防止穿模

                    // 縱向修正：強制分開
                    horseA.s -= pushDirS * overlap * ratioA * 0.8;
                    horseB.s += pushDirS * overlap * ratioB * 0.8;

                    // 橫向修正：輕微推開
                    horseA.d -= pushDirD * overlap * ratioA * 0.5;
                    horseB.d += pushDirD * overlap * ratioB * 0.5;

                    // **速度調整**：後方馬強制減速
                    if (deltaS > 0) {
                        // B 在 A 後方，B 減速
                        horseB.speed *= 0.92;
                    } else {
                        // A 在 B 後方，A 減速
                        horseA.speed *= 0.92;
                    }
                } else {
                    // **不同跑道側面碰撞**：主要修正橫向

                    // 橫向修正：主要修正方向
                    horseA.d -= pushDirD * overlap * ratioA;
                    horseB.d += pushDirD * overlap * ratioB;

                    // 縱向修正：輕微
                    horseA.s -= pushDirS * overlap * ratioA * 0.3;
                    horseB.s += pushDirS * overlap * ratioB * 0.3;

                    // 輕微減速
                    horseA.speed *= 0.97;
                    horseB.speed *= 0.97;
                }

                // 限制在賽道範圍內
                const trackWidth = this.frenet.getTrackWidth();
                horseA.d = Math.max(0.5, Math.min(horseA.d, trackWidth - 0.5));
                horseB.d = Math.max(0.5, Math.min(horseB.d, trackWidth - 0.5));
            }
        }
    }
}