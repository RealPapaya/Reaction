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

                // 橫向（d）修正：主要修正方向
                horseA.d -= pushDirD * overlap * ratioA;
                horseB.d += pushDirD * overlap * ratioB;

                // 縱向（s）修正：輕微修正，避免穿透超車
                // 如果 B 在 A 後方但試圖穿透
                if (deltaS > 0 && deltaS < 2.0 && Math.abs(deltaD) < 1.0) {
                    // B 無法穿透 A，強制減速
                    horseB.s -= overlap * 0.5 * ratioB;
                    horseB.speed *= 0.95;
                } else if (deltaS < 0 && deltaS > -2.0 && Math.abs(deltaD) < 1.0) {
                    // A 無法穿透 B
                    horseA.s -= overlap * 0.5 * ratioA;
                    horseA.speed *= 0.95;
                }

                // 限制在賽道範圍內
                const trackWidth = this.frenet.getTrackWidth();
                horseA.d = Math.max(0.5, Math.min(horseA.d, trackWidth - 0.5));
                horseB.d = Math.max(0.5, Math.min(horseB.d, trackWidth - 0.5));
            }
        }
    }
}

