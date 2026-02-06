// ====================================
// 彎道卡頓 Debug 系統
// 用於逐步定位問題
// ====================================

class CornerDebugger {
    constructor() {
        this.frameData = [];
        this.maxFrames = 300; // 保留最近 5 秒數據（60 FPS）
        this.jumpDetected = false;
        this.jumpThreshold = 0.5; // s 座標跳變閾值（米）

        // 創建 debug overlay
        this.createDebugOverlay();
    }

    createDebugOverlay() {
        // 創建浮動 debug 面板
        const panel = document.createElement('div');
        panel.id = 'cornerDebugPanel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.9);
            color: #0f0;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            padding: 10px;
            border: 2px solid #0f0;
            border-radius: 5px;
            overflow-y: auto;
            z-index: 10000;
            display: none;
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>🔍 彎道 Debug 監控</strong>
                <button id="closeDebug" style="background: #f00; color: #fff; border: none; padding: 2px 8px; cursor: pointer;">關閉</button>
            </div>
            <div id="debugContent"></div>
        `;

        document.body.appendChild(panel);

        // 關閉按鈕
        document.getElementById('closeDebug').onclick = () => {
            panel.style.display = 'none';
        };

        // 創建開啟按鈕
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = '📊 Debug';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 15px;
            background: #0f0;
            color: #000;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            z-index: 9999;
        `;
        toggleBtn.onclick = () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        };
        document.body.appendChild(toggleBtn);
    }

    // ====================================
    // 主要監控方法 - 在每一幀調用
    // ====================================
    captureFrame(simulator, frameCount) {
        const horses = simulator.horses;
        const frenet = simulator.frenet;

        const frameInfo = {
            frame: frameCount,
            time: simulator.raceTime,
            horses: []
        };

        horses.forEach(horse => {
            if (!horse.hasStarted || horse.finished) return;

            const cornerRadius = frenet.getCornerRadiusAt(horse.s);
            const isInCorner = cornerRadius < Infinity;

            const horseData = {
                id: horse.id,
                s: horse.s,
                d: horse.d,
                speed: horse.speed,
                lateralSpeed: horse.lateralSpeed || 0,

                // 彎道相關
                cornerRadius: cornerRadius,
                smoothRadius: horse.lastCornerRadius,
                isInCorner: isInCorner,

                // 速度相關
                speedDamping: horse.speedDamping || 1.0,

                // 碰撞相關
                isBoxedIn: horse.isBoxedIn,
                isOvertaking: horse.isOvertaking
            };

            // **檢測異常跳變**
            if (this.frameData.length > 0) {
                const lastFrame = this.frameData[this.frameData.length - 1];
                const lastHorse = lastFrame.horses.find(h => h.id === horse.id);

                if (lastHorse) {
                    const deltaS = Math.abs(horse.s - lastHorse.s);
                    const expectedDelta = horse.speed * 0.016; // 假設 60 FPS

                    // **跳變檢測**
                    if (deltaS > expectedDelta * 2 && isInCorner) {
                        horseData.JUMP_DETECTED = true;
                        horseData.jumpAmount = deltaS;
                        horseData.expectedDelta = expectedDelta;
                        this.jumpDetected = true;

                        // **記錄跳變詳情**
                        this.logJump(horse, lastHorse, frameCount);
                    }
                }
            }

            frameInfo.horses.push(horseData);
        });

        // 保存數據
        this.frameData.push(frameInfo);
        if (this.frameData.length > this.maxFrames) {
            this.frameData.shift();
        }

        // 更新 UI
        this.updateDebugUI();
    }

    // ====================================
    // 跳變記錄
    // ====================================
    logJump(horse, lastHorse, frameCount) {
        console.error(`
🚨 彎道跳變檢測！
==================
幀數: ${frameCount}
馬匹: ${horse.id}
位置變化: ${lastHorse.s.toFixed(2)} → ${horse.s.toFixed(2)} (Δ${(horse.s - lastHorse.s).toFixed(3)}m)
預期變化: ${(horse.speed * 0.016).toFixed(3)}m
速度: ${horse.speed.toFixed(2)} m/s
彎道半徑: ${horse.lastCornerRadius === Infinity ? '∞' : horse.lastCornerRadius?.toFixed(1) || 'N/A'}
橫向速度: ${(horse.lateralSpeed || 0).toFixed(3)} m/s
阻尼: ${(horse.speedDamping || 1.0).toFixed(3)}
        `);
    }

    // ====================================
    // 更新 Debug UI
    // ====================================
    updateDebugUI() {
        const content = document.getElementById('debugContent');
        if (!content) return;

        if (this.frameData.length === 0) {
            content.innerHTML = '<p>等待數據...</p>';
            return;
        }

        const latest = this.frameData[this.frameData.length - 1];

        let html = `<div style="margin-bottom: 10px;">
            <strong>幀: ${latest.frame}</strong> | 
            時間: ${latest.time.toFixed(2)}s
        </div>`;

        // 顯示每匹馬的狀態
        latest.horses.forEach(horse => {
            const inCorner = horse.isInCorner;
            const hasJump = horse.JUMP_DETECTED;

            html += `
            <div style="
                margin: 5px 0; 
                padding: 5px; 
                background: ${hasJump ? '#ff0000' : (inCorner ? '#333' : '#111')};
                border-left: 3px solid ${hasJump ? '#f00' : (inCorner ? '#ff0' : '#0f0')};
            ">
                <strong>馬 ${horse.id}</strong> ${inCorner ? '🔴 彎道中' : ''}
                ${hasJump ? '<span style="color: #f00;">⚠️ 跳變!</span>' : ''}
                <br>
                s: ${horse.s.toFixed(2)}m | d: ${horse.d.toFixed(2)}m
                <br>
                速度: ${horse.speed.toFixed(2)} | 橫向: ${horse.lateralSpeed.toFixed(3)}
                <br>
                半徑: ${horse.cornerRadius === Infinity ? '∞' : horse.cornerRadius.toFixed(1)}
                → ${horse.smoothRadius === Infinity ? '∞' : horse.smoothRadius?.toFixed(1) || 'N/A'}
                <br>
                阻尼: ${horse.speedDamping.toFixed(3)}
                ${hasJump ? `<br><span style="color: #f00;">跳變量: ${horse.jumpAmount.toFixed(3)}m (預期: ${horse.expectedDelta.toFixed(3)}m)</span>` : ''}
            </div>`;
        });

        content.innerHTML = html;
    }

    // ====================================
    // 導出數據分析
    // ====================================
    exportData() {
        const blob = new Blob([JSON.stringify(this.frameData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `corner-debug-${Date.now()}.json`;
        a.click();
    }

    // ====================================
    // 繪製視覺化數據（在 Canvas 上）
    // ====================================
    drawDebugOverlay(ctx, simulator, canvasWidth, canvasHeight) {
        // 繪製 s 座標曲線圖
        const graphHeight = 150;
        const graphY = canvasHeight - graphHeight - 10;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, graphY, 300, graphHeight);

        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.font = '12px monospace';
        ctx.fillStyle = '#0f0';
        ctx.fillText('s 座標變化', 15, graphY + 15);

        if (this.frameData.length < 2) return;

        // 繪製每匹馬的 s 曲線
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff', '#fff', '#f80'];

        simulator.horses.forEach((horse, idx) => {
            ctx.strokeStyle = colors[idx % colors.length];
            ctx.beginPath();

            let started = false;
            this.frameData.forEach((frame, i) => {
                const horseData = frame.horses.find(h => h.id === horse.id);
                if (!horseData) return;

                const x = 15 + (i / this.frameData.length) * 280;
                const y = graphY + graphHeight - 20 - (horseData.s / simulator.frenet.pathLength) * (graphHeight - 30);

                if (!started) {
                    ctx.moveTo(x, y);
                    started = true;
                } else {
                    ctx.lineTo(x, y);
                }

                // 標記跳變點
                if (horseData.JUMP_DETECTED) {
                    ctx.fillStyle = '#f00';
                    ctx.fillRect(x - 2, y - 2, 4, 4);
                    ctx.fillStyle = colors[idx % colors.length];
                }
            });

            ctx.stroke();
        });
    }
}
// 導出數據
// debugger.exportData();