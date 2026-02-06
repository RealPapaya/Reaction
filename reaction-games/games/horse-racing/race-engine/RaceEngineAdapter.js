// ====================================
// Race Engine Adapter
// 將 RaceSimulator 物理引擎適配到遊戲主程式
// ====================================

class RaceEngineAdapter {
    constructor(canvas, horses, trackData) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.simulator = null;
        this.trackPath = null;
        this.gameHorses = null;
        this.isRunning = false;
        this.isPreparing = false; // 🎯 準備階段標記
        this.countdownText = "";  // 🎯 倒數文字
        this.animationId = null;
        this.resizeObserver = null;

        // 🎯 基礎參考尺寸 (Response Design Base)
        this.BASE_WIDTH = 1000;
        this.BASE_HEIGHT = 600;
        this.currentScale = 1.0;

        // 🎯 賽道參數
        this.STRAIGHT_LENGTH = 230;
        this.CORNER_RADIUS = 100;
        this.FINISH_X = 0;      // 終點：正中間
        this.START_X = 0;       // 起點：等於終點 (Run 1 full lap)

        // 🎯 物理-視覺比例轉換
        // 基礎 PIXELS_PER_METER (對應 1000px 寬度)
        // 降低比例以讓更寬的跑道能塞進畫面 (原本 2.2 -> 2.0)
        this.BASE_PIXELS_PER_METER = 2.0;

        // 當前實際使用的值 (會在 resize 中更新)
        this.PIXELS_PER_METER = this.BASE_PIXELS_PER_METER;

        this.VISUAL_SCALE = 3.0; // 馬匹視覺縮放 (保持不變，會隨 PIXELS_PER_METER 自動縮放)
        this.HORSE_PHYSICAL_LENGTH = 2.0;
        this.HORSE_PHYSICAL_WIDTH = 1.2;

        // 視覺尺寸 (會在 resize 中更新)
        this.HORSE_VISUAL_LENGTH = 0;
        this.HORSE_VISUAL_WIDTH = 0;

        // 初始化監聽
        if (this.canvas) {
            this.setupResizeListener();
            this.handleResize(); // 初始 Force Resize
        }

        // 如果提供了參數，直接啟動 (相容舊介面)
        if (canvas && horses && trackData) {
            this.startRace(horses, trackData);
        }
    }

    // ====================================
    // 主要 API
    // ====================================

    startRace(gameHorses, trackData, elapsedTime = 0) {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.gameHorses = gameHorses;

        if (!this.simulator) {
            this.initSimulator(gameHorses, trackData);
        }

        // 確保 Simulator 參數正確
        this.setupRaceConditions();

        this.simulator.startRace();
        this.isRunning = true;
        this.isPreparing = false; // 切換為正式比賽

        // 🎯 支援中途加入 (Fast Forward)
        if (elapsedTime > 0) {
            const steps = Math.floor(elapsedTime / (1000 / 60)); // 60 FPS assumption
            // Limit max fast forward to prevent freeze (e.g. max 5 seconds of sim per frame, or just do it all?)
            // For 2 minutes race, 7200 frames. Might freeze UI.
            // But physics is simple. Let's try direct loop up to 2000 steps (approx 33s) per chunk or just run it.
            // Given JS speed, 6000 steps is fine.
            console.log(`⏩ Fast-Forwarding Race: ${steps} frames (${elapsedTime}ms)`);
            for (let i = 0; i < steps; i++) {
                this.simulator.update();
                if (this.simulator.isFinished) break;
            }
        }

        this.animate();
    }

    initSimulator(gameHorses, trackData) {
        const rawPath = this.createStadiumPath();
        const simulatorHorses = this.convertHorsesToSimulatorFormat(gameHorses);

        // Pre-calculate race distance to ensure it's set correctly from start
        // 假設上直線從 x = -STRAIGHT_LENGTH/2 開始，方向向右
        const startPathOffset = this.STRAIGHT_LENGTH / 2;
        const finishS = this.FINISH_X + startPathOffset;

        // Use a temporary Frenet to get path length if needed, or assume loop
        // But we don't have frenet yet. 
        // We know structure: 2*Straight + 2*PI*R.
        // straightLength=230, cornerRadius=100.
        // pathLength ~= 2*230 + 2*PI*100 ~= 460 + 628.3 = 1088.3

        // Better way: Instantiate temp frenet or calculate manually?
        // Let's iterate points.
        let pathLength = 0;
        for (let i = 1; i < rawPath.length; i++) {
            const dx = rawPath[i].x - rawPath[i - 1].x;
            const dy = rawPath[i].y - rawPath[i - 1].y;
            pathLength += Math.sqrt(dx * dx + dy * dy);
        }
        // closed loop
        const last = rawPath[rawPath.length - 1];
        const first = rawPath[0];
        pathLength += Math.sqrt((first.x - last.x) ** 2 + (first.y - last.y) ** 2);

        const raceDistance = pathLength + finishS;

        console.log(`🏁 Race Distance Setup: PathLen=${pathLength.toFixed(1)}, FinishS=${finishS}, RaceDist=${raceDistance.toFixed(1)}`);

        this.simulator = new RaceSimulator(rawPath, simulatorHorses, {
            raceDistance: raceDistance
        });
        this.trackPath = rawPath;
    }

    setupRaceConditions() {
        if (!this.simulator) return;

        // 計算 Start/Finish 的 S 座標
        // 假設上直線從 x = -STRAIGHT_LENGTH/2 開始，方向向右
        const startPathOffset = this.STRAIGHT_LENGTH / 2;
        const startS = this.START_X + startPathOffset;
        const finishS = this.FINISH_X + startPathOffset;

        // 設定馬匹起始位置
        // 如果是準備階段 OR 比賽時間為 0 (剛初始化)，強制設定為 startS
        this.simulator.horses.forEach((h, i) => {
            // 保持 lane spacing 初始化邏輯，只更新 s
            if (this.isPreparing || this.simulator.raceTime === 0) {
                h.s = startS;
                h.d = this.simulator.frenet.getTrackWidth() / this.simulator.horses.length * (i + 0.5);
                h.targetD = h.d; // Ensure targetD is synced
            }
        });

        // 設定比賽距離：跑一圈 + 到終點的距離
        // 因為起點在終點前 (-40 < 0)，如果不加一圈，距離只有 40m
        // 所以邏輯是：起點 -> (經過終點 ignored) -> 繞一圈 -> 終點
        // 總距離 = 完整一圈長度 + 終點S
        // Wait, index 0 is at -115.
        // StartS = 75. FinishS = 115.
        // Horse runs 75 -> ... -> PathEnd -> ... -> 115.
        // Distance = (PathLen - StartS) + FinishS? No.
        // If s continues increasing:
        // Target = PathLen + FinishS.
        this.simulator.raceDistance = this.simulator.frenet.pathLength + finishS;
    }

    /**
     * 🎯 新增：啟動準備模式
     * 讓馬匹出現在起點但不動，並顯示中央倒數
     */
    startPreparation(gameHorses, trackData) {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.gameHorses = gameHorses;
        this.isPreparing = true;

        this.initSimulator(gameHorses, trackData);
        this.setupRaceConditions();

        // 初始化馬匹位置但不啟動比賽
        // setupRaceConditions 已經設定了 s，這裡確保其他狀態重置
        // this.simulator.initializeHorses(); // 已經在 new RaceSimulator 做過，且 setupRaceConditions 覆蓋了 s

        this.isRunning = true;
        this.animate();
    }

    /**
     * 🎯 1:1 同步：建立操場型賽道 (Stadium Path)
     */
    createStadiumPath() {
        const points = [];
        // 為了適應 1000px 畫布，微調物理尺寸但保持比例 (PIXELS_PER_METER = 2.2)
        // 為了適應 1000px 畫布，微調物理尺寸但保持比例 (PIXELS_PER_METER = 2.2)
        const straightLength = this.STRAIGHT_LENGTH;
        const cornerRadius = this.CORNER_RADIUS;
        const centerX = 0;
        const centerY = 0;
        const numPointsPerSegment = 40;

        // 1. 上直線
        for (let i = 0; i <= numPointsPerSegment; i++) {
            const t = i / numPointsPerSegment;
            points.push({
                x: centerX - straightLength / 2 + t * straightLength,
                y: centerY - cornerRadius
            });
        }

        // 2. 右彎道 (180度)
        for (let i = 1; i <= numPointsPerSegment; i++) {
            const t = i / numPointsPerSegment;
            const angle = -Math.PI / 2 + t * Math.PI;
            points.push({
                x: centerX + straightLength / 2 + Math.cos(angle) * cornerRadius,
                y: centerY + Math.sin(angle) * cornerRadius
            });
        }

        // 3. 下直線
        for (let i = 1; i <= numPointsPerSegment; i++) {
            const t = i / numPointsPerSegment;
            points.push({
                x: centerX + straightLength / 2 - t * straightLength,
                y: centerY + cornerRadius
            });
        }

        // 4. 左彎道 (180度)
        for (let i = 1; i <= numPointsPerSegment; i++) {
            const t = i / numPointsPerSegment;
            const angle = Math.PI / 2 + t * Math.PI;
            points.push({
                x: centerX - straightLength / 2 + Math.cos(angle) * cornerRadius,
                y: centerY + Math.sin(angle) * cornerRadius
            });
        }

        return points;
    }

    animate() {
        if (!this.isRunning) return;

        // 準備階段不更新模擬器物理，僅渲染
        if (!this.isPreparing) {
            this.update();
        }

        if (this.canvas) this.render();

        if (this.isRunning) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    update() {
        if (!this.simulator || !this.isRunning) return;
        this.simulator.update();
        if (!this.simulator.isRunning) {
            this.isRunning = false;
        }
    }

    getLeaderboard() {
        if (!this.simulator) return [];
        const leaderboard = this.simulator.getCurrentLeaderboard();
        return leaderboard.map(entry => {
            const h = entry.horse;
            let name = h.name;
            if (!name || name === 'undefined') name = `馬匹 ${h.id}`;
            return {
                horseId: h.id,
                horseName: name,
                position: entry.position,
                distance: entry.distance,
                isBoxedIn: h.isBoxedIn,
                isOvertaking: h.isOvertaking
            };
        });
    }

    getRenderData() {
        if (!this.simulator) return { horses: [], trackPath: [] };
        const positions = this.simulator.getHorseWorldPositions();
        const horses = positions.map((h, index) => ({
            x: h.worldX,
            y: h.worldY,
            heading: h.heading,
            id: h.id,
            name: h.name || `馬匹 ${h.id}`,
            isBoxedIn: h.isBoxedIn,
            history: h.positionHistory || []
        }));

        return {
            horses: horses,
            trackPath: this.highResTrack || this.trackPath,
            leaderboard: this.getLeaderboard()
        };
    }

    stopRace() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.simulator) this.simulator.stopRace();
        this.isRunning = false;
    }

    // ====================================
    // Canvas Resizing & DPI Handling
    // ====================================

    setupResizeListener() {
        this.resizeObserver = new ResizeObserver(() => {
            this.handleResize();
        });
        this.resizeObserver.observe(this.canvas);
    }

    handleResize() {
        if (!this.canvas) return;

        // 1. 獲取顯示尺寸 (CSS pixels)
        const rect = this.canvas.getBoundingClientRect();

        // 2. 處理 DPI (Retina Display support)
        const dpr = window.devicePixelRatio || 1;

        // 3. 設定 Canvas 內部緩衝區尺寸
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // 4. 計算縮放比例 (以寬度為基準，讓視野保持一致)
        // 為什麼用寬度？因為賽道是橫向的，我們希望寬度適配螢幕
        // 這裡計算的是 "當前物理像素" 相對於 "設計稿物理像素 (1000px)" 的比例
        // 簡單點：如果 CSS 寬度是 1000px，DPR=2，那 width=2000。
        // 我們希望視覺上看起來和 1000px 一樣大 (只是更清晰)。
        // 所以我們應該基於 CSS 寬度來決定物件的"相對大小"，然後乘上 DPR 得到物理像素大小。

        const cssScale = rect.width / this.BASE_WIDTH; // 例如 1920 / 1000 = 1.92
        this.currentScale = cssScale * dpr;            // 繪圖指令(像素單位)需要乘上 DPR

        // 5. 更新依賴尺寸的參數
        this.PIXELS_PER_METER = this.BASE_PIXELS_PER_METER * this.currentScale;

        this.HORSE_VISUAL_LENGTH = this.HORSE_PHYSICAL_LENGTH * this.PIXELS_PER_METER * this.VISUAL_SCALE;
        this.HORSE_VISUAL_WIDTH = this.HORSE_PHYSICAL_WIDTH * this.PIXELS_PER_METER * this.VISUAL_SCALE;
    }

    // ====================================
    // 🎨 渲染核心 (移植自 test-simulator.html)
    // ====================================

    physicsToCanvas(px, py) {
        // 固定偏移量與比例，不再動態計算，確保與測試版本完全一致
        const offsetX = this.canvas.width / 2;
        const offsetY = this.canvas.height / 2;
        return {
            x: offsetX + px * this.PIXELS_PER_METER,
            y: offsetY + py * this.PIXELS_PER_METER
        };
    }

    render() {
        if (!this.canvas || !this.ctx || !this.simulator) return;

        // 1. 清空畫布 (美化綠色)
        this.ctx.fillStyle = '#7EC850';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const renderData = this.getRenderData();

        // 2. 繪製賽道基礎
        this.drawTrackBase(renderData.trackPath);

        // 3. 繪製馬匹 (深度排序)
        const sortedHorses = [...renderData.horses].sort((a, b) => a.y - b.y);
        this.drawHorses(sortedHorses);

        // 4. 🎯 準備階段顯示中央倒數
        if (this.isPreparing && this.countdownText) {
            this.renderCountdown();
        }

        // 5. 🎯 繪製即時排名榜
        this.renderLeaderboard();
    }

    /**
     * 🎯 繪製即時排名榜 (Neubrutalism Style)
     * 風格化：白底、黑外框、硬陰影
     */
    renderLeaderboard() {
        // 準備階段不顯示排名 (等待倒數結束)
        if (this.isPreparing) return;

        const leaderboard = this.getLeaderboard();
        if (!leaderboard || leaderboard.length === 0) return;

        // Init visual ranks map if needed
        if (!this.visualRanks) {
            this.visualRanks = new Map();
            leaderboard.forEach((entry, index) => {
                this.visualRanks.set(entry.horseId, index);
            });
        }

        // 固定顏色映射 (需與 drawHorses 一致)
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

        // 縮小尺寸以適應內場空間 (寬度增加以容納全名)
        const padding = 12 * this.currentScale; // 增加一點 padding
        const width = 300 * this.currentScale;
        const rowHeight = 24 * this.currentScale; // 增加行高
        const totalHeight = leaderboard.length * rowHeight + padding * 2;

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        // 計算位置：正中間 (Center Screen)
        const x = cx - (width / 2);
        const y = cy - (totalHeight / 2);

        this.ctx.save();

        // 1. 硬陰影 (Hard Shadow) - 黑色，向右下偏移
        const shadowOffset = 6 * this.currentScale;
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        // 陰影位置 = 原位置 + offset
        this.ctx.roundRect(x + shadowOffset, y + shadowOffset, width, totalHeight, 8 * this.currentScale);
        this.ctx.fill();

        // 2. 主體 (Main Box) - 白色 (配合主題風格)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, totalHeight, 8 * this.currentScale);
        this.ctx.fill();

        // 3. 粗外框 (Bold Border)
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3 * this.currentScale;
        this.ctx.stroke();

        // 列表
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        // Update Visual Ranks & Render Mobile Rows
        // Logic:
        // 1. Draw static Rank Numbers (1, 2, 3...) at fixed slots.
        // 2. Draw Horse Rows at interpolated Y positions.

        // A. Create map of Target Ranks
        const targetRankMap = new Map();
        leaderboard.forEach((entry, index) => {
            targetRankMap.set(entry.horseId, index);
        });

        // B. Draw Static Rank Numbers
        for (let i = 0; i < leaderboard.length; i++) {
            const itemY = y + padding + i * rowHeight;
            const rank = i + 1;

            // Medal Colors logic
            let rankColor = '#000000'; // Default black
            if (rank === 1) rankColor = '#FFD700'; // Gold
            else if (rank === 2) rankColor = '#C0C0C0'; // Silver
            else if (rank === 3) rankColor = '#CD7F32'; // Bronze

            this.ctx.font = `bold ${12 * this.currentScale}px "Segoe UI", Arial`;
            this.ctx.fillStyle = rankColor;
            this.ctx.fillText(`${i + 1}.`, x + 12 * this.currentScale, itemY + rowHeight / 2);
        }

        // C. Update & Draw Dynamic Horse Rows
        // Iterate through all horses in the leaderboard data (which contains all horses)
        // But the order of iteration doesn't matter for logic, but might matter for Z-order overlap.
        // It's better to iterate by visual rank to keep z-order ?? No.
        // Just iterate the data array.

        leaderboard.forEach(entry => {
            const horseId = entry.horseId;
            const targetRank = targetRankMap.get(horseId);
            let visualRank = this.visualRanks.get(horseId);

            if (typeof visualRank !== 'number') {
                visualRank = targetRank;
                this.visualRanks.set(horseId, visualRank);
            }

            // Lerp (Smoothing)
            // Adjust speed here. 0.1 is standard smooth. 0.2 is faster.
            const diff = targetRank - visualRank;
            if (Math.abs(diff) > 0.01) {
                visualRank += diff * 0.15;
            } else {
                visualRank = targetRank;
            }
            this.visualRanks.set(horseId, visualRank);

            // Calculate Y based on visual rank
            const itemY = y + padding + visualRank * rowHeight;

            // Draw Horse Info Row
            // 馬號色塊 (保持顏色，增加細黑邊)
            const colorIdx = (entry.horseId - 1) % colors.length;
            const color = colors[colorIdx];

            this.ctx.fillStyle = color;
            const boxSize = 16 * this.currentScale; // 稍微大一點
            // 調整 X 位置
            const boxX = x + 35 * this.currentScale;
            // Center box vertically in the calculated row
            const boxY = itemY + (rowHeight - boxSize) / 2;

            this.ctx.fillRect(boxX, boxY, boxSize, boxSize);

            // 色塊邊框
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1.5 * this.currentScale;
            this.ctx.strokeRect(boxX, boxY, boxSize, boxSize);

            // 馬號 (文字)
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = `bold ${11 * this.currentScale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.lineWidth = 2 * this.currentScale;
            this.ctx.strokeText(entry.horseId, boxX + boxSize / 2, boxY + boxSize / 2 + 1);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(entry.horseId, boxX + boxSize / 2, boxY + boxSize / 2 + 1);

            // 馬名 (文字)
            this.ctx.textAlign = 'left';
            this.ctx.font = `bold ${12 * this.currentScale}px "Segoe UI", Arial`;
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText(entry.horseName, boxX + boxSize + 10 * this.currentScale, itemY + rowHeight / 2);
        });

        this.ctx.restore();
    }

    renderCountdown() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.ctx.save();

        // 半徑
        const r = 80 * (this.currentScale / window.devicePixelRatio);

        // 1. 硬陰影 (Hard Shadow)
        const shadowOffset = 6 * this.currentScale;
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(cx + shadowOffset, cy + shadowOffset, r, 0, Math.PI * 2);
        this.ctx.fill();

        // 2. 主體 (Main Circle) - 白色
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
        this.ctx.fill();

        // 3. 粗外框 (Bold Border)
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 4 * this.currentScale; // 稍微更粗一點
        this.ctx.stroke();

        // 文字
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 數字 (黑色) - 僅顯示秒數
        this.ctx.fillStyle = '#000000';
        const fontSizeBig = 48 * (this.currentScale / window.devicePixelRatio);
        this.ctx.font = `bold ${fontSizeBig}px "Segoe UI", Arial`;

        // 嘗試解析秒數 (如果是 "00:05" 格式)
        let displayText = this.countdownText;
        if (typeof displayText === 'string' && displayText.includes(':')) {
            const parts = displayText.split(':');
            displayText = parseInt(parts[parts.length - 1], 10).toString();
        } else if (!isNaN(parseInt(displayText))) {
            displayText = parseInt(displayText, 10).toString();
        }

        // 置中顯示 (垂直位置不再需要避開標題)
        this.ctx.fillText(displayText, cx, cy);

        // 標題已移除

        this.ctx.restore();
    }

    drawTrackBase(trackPath) {
        if (!trackPath || trackPath.length === 0) return;

        // 參數設為與 createStadiumPath 一致
        const straightLen = 230 * this.PIXELS_PER_METER;
        const radiusOuter = 100 * this.PIXELS_PER_METER;

        // 跑道寬度：8條跑道 * 2.1m = 16.8m => 取 17.5m 寬鬆一點
        const trackWidthM = 17.5;
        const trackWidthPx = trackWidthM * this.PIXELS_PER_METER;
        const radiusInner = radiusOuter - trackWidthPx;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // 輔助函式：繪製體育場形狀路徑
        const traceStadium = (r) => {
            this.ctx.beginPath();
            // 上直線 (左到右) 
            this.ctx.moveTo(centerX - straightLen / 2, centerY - r);
            this.ctx.lineTo(centerX + straightLen / 2, centerY - r);
            // 右彎
            this.ctx.arc(centerX + straightLen / 2, centerY, r, -Math.PI / 2, Math.PI / 2);
            // 下直線 (右到左)
            this.ctx.lineTo(centerX - straightLen / 2, centerY + r);
            // 左彎
            this.ctx.arc(centerX - straightLen / 2, centerY, r, Math.PI / 2, Math.PI * 1.5);
            this.ctx.closePath();
        };

        // 1. 繪製最底層：全場白邊 (Outer Border)
        // 用稍大一點的半徑畫白底
        this.ctx.fillStyle = '#ffffff';
        traceStadium(radiusOuter + 4 * this.currentScale);
        this.ctx.fill();

        // 2. 繪製咖啡色跑道 (Outer Radius)
        this.ctx.fillStyle = '#925826';
        traceStadium(radiusOuter);
        this.ctx.fill();

        const startLineWidth = 4 * this.currentScale;
        const startLineHeight = trackWidthPx;

        // 3.1 繪製起點線 (已移除，與終點線合併)

        // 3.2 繪製終點線 (Finish Line) - Checkered Logic simplified
        const finishXPos = this.physicsToCanvas(this.FINISH_X, -this.CORNER_RADIUS);

        // 畫格紋旗效果
        const checkSize = startLineHeight / 8;
        for (let r = 0; r < 8; r++) {
            this.ctx.fillStyle = (r % 2 === 0) ? '#000000' : '#FFFFFF';
            this.ctx.fillRect(finishXPos.x - 4, finishXPos.y + r * checkSize, 4, checkSize);
            this.ctx.fillStyle = (r % 2 === 1) ? '#000000' : '#FFFFFF';
            this.ctx.fillRect(finishXPos.x, finishXPos.y + r * checkSize, 4, checkSize);
        }

        // 4. 繪製內場草地 (Inner Radius) - 這會遮住內側的咖啡色和起點線多餘部分 (如果有)
        this.ctx.fillStyle = '#7EC850';
        traceStadium(radiusInner);
        this.ctx.fill();

        // 5. 繪製內外圍欄線 (Rails)
        this.ctx.lineWidth = 2 * this.currentScale;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';

        // 內圈
        traceStadium(radiusInner);
        this.ctx.stroke();

        // 外圈
        traceStadium(radiusOuter);
        this.ctx.stroke();

        // 6. 跑道間隔線 (Lane Lines)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = Math.max(1, 1 * this.currentScale);
        for (let lane = 1; lane < 8; lane++) {
            const laneD = lane * 2.1;
            this.ctx.beginPath();
            trackPath.forEach((p, i) => {
                const s = i * (this.simulator.frenet.pathLength / trackPath.length);
                const worldPos = this.simulator.frenet.frenetToWorld(s, laneD);
                const pos = this.physicsToCanvas(worldPos.x, worldPos.y);
                if (i === 0) this.ctx.moveTo(Math.round(pos.x), Math.round(pos.y));
                else this.ctx.lineTo(Math.round(pos.x), Math.round(pos.y));
            });
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    drawHorses(horses) {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        const leaderboard = this.getLeaderboard();

        horses.forEach((horse) => {
            const canvasPos = this.physicsToCanvas(horse.x, horse.y);
            const colorIdx = (horse.id - 1) % colors.length;
            const mainColor = colors[colorIdx];

            // 1. 軌跡
            if (horse.history.length > 2) {
                this.ctx.strokeStyle = mainColor + '44';
                this.ctx.lineWidth = Math.max(1, 1 * this.currentScale);
                this.ctx.beginPath();
                horse.history.forEach((h, i) => {
                    const worldPos = this.simulator.frenet.frenetToWorld(h.s, h.d);
                    const pos = this.physicsToCanvas(worldPos.x, worldPos.y);
                    if (i === 0) this.ctx.moveTo(pos.x, pos.y);
                    else this.ctx.lineTo(pos.x, pos.y);
                });
                this.ctx.stroke();
            }

            // 2. 陰影
            this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(
                canvasPos.x + (3 * this.currentScale),
                canvasPos.y + (3 * this.currentScale),
                10 * this.currentScale,
                6 * this.currentScale,
                horse.heading || 0, 0, Math.PI * 2
            );
            this.ctx.fill();

            // 3. 🎯 1:1 同步：馬匹矩形
            this.ctx.save();
            this.ctx.translate(canvasPos.x, canvasPos.y);
            this.ctx.rotate(horse.heading || 0);
            this.ctx.fillStyle = mainColor;
            this.ctx.fillStyle = mainColor;
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = Math.max(1, 1 * this.currentScale);
            this.ctx.fillRect(-this.HORSE_VISUAL_LENGTH / 2, -this.HORSE_VISUAL_WIDTH / 2, this.HORSE_VISUAL_LENGTH, this.HORSE_VISUAL_WIDTH);
            this.ctx.strokeRect(-this.HORSE_VISUAL_LENGTH / 2, -this.HORSE_VISUAL_WIDTH / 2, this.HORSE_VISUAL_LENGTH, this.HORSE_VISUAL_WIDTH);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = `bold ${10 * this.currentScale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(horse.id, 0, 0);
            this.ctx.restore();

            // 4. 🎯 1:1 同步：標籤引線邏輯 (Leash toward center)
            const rankInfo = leaderboard.find(l => l.horseId === horse.id);
            const rank = rankInfo ? rankInfo.position : '?';

            const centerCanvas = this.physicsToCanvas(0, 0);
            const dx = Math.round(centerCanvas.x - canvasPos.x); // 取整
            const dy = Math.round(centerCanvas.y - canvasPos.y); // 取整
            const distToCenter = Math.sqrt(dx * dx + dy * dy);

            // 標籤定位
            // 標籤定位：改為向外延伸 (Away from Center)
            // 賽道寬 74px (半寬37)，馬匹在距離圓心約 80~100 的位置
            // 我們希望標籤在賽道外側 (Radius > 100)
            // 馬匹位置 canvasPos 本身約在 Radius 85-95 處
            // 設定固定距離讓它指出賽道外
            const labelDistance = 90 * this.currentScale; // 延長至 90 (原 50)

            // (dx, dy) 是指向圓心的向量，減去它就是指向外
            const lx = Math.round(canvasPos.x - (dx / distToCenter) * labelDistance);
            const ly = Math.round(canvasPos.y - (dy / distToCenter) * labelDistance);

            this.ctx.strokeStyle = mainColor;
            this.ctx.lineWidth = 1.5 * this.currentScale; // 加粗引線
            this.ctx.beginPath();
            this.ctx.moveTo(Math.round(canvasPos.x), Math.round(canvasPos.y));
            this.ctx.lineTo(lx, ly);
            this.ctx.stroke();

            const labelText = `#${horse.id}`;

            // 標籤字體優化
            const fontSize = Math.max(12, 12 * this.currentScale); // 最小 12px
            this.ctx.font = `bold ${fontSize}px "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

            const tw = this.ctx.measureText(labelText).width;
            const padding = 6 * this.currentScale;
            const height = fontSize * 1.6;

            // 標籤背景 (加陰影讓它浮起來)
            this.ctx.save();
            this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
            this.ctx.shadowBlur = 4;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            // Rounded rect implementation simple
            const rx = lx - tw / 2 - padding;
            const ry = ly - height / 2;
            const rw = tw + padding * 2;
            const rh = height;

            this.ctx.beginPath();
            this.ctx.roundRect(rx, ry, rw, rh, 4);
            this.ctx.fill();
            this.ctx.restore();

            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            // 稍微微調文字垂直位置
            this.ctx.fillText(labelText, lx, ly + 1);
        });
    }

    // ====================================
    // 資料轉換
    // ====================================

    convertTrackToPath(trackData) {
        // 固定為操場形狀，不再依賴 trackData
        return this.createStadiumPath();
    }

    convertHorsesToSimulatorFormat(gameHorses) {
        return gameHorses.map(horse => {
            const form = horse.form || 50;
            return {
                id: horse.id,
                name: horse.name,
                competitiveFactor: form,
                runningStyle: horse.runningStyle || this.inferRunningStyle(form),
                originalData: horse
            };
        });
    }

    inferRunningStyle(form) {
        const r = Math.random();
        if (form >= 80) return r < 0.4 ? '逃' : (r < 0.8 ? '前' : '追');
        if (form >= 60) return r < 0.3 ? '逃' : (r < 0.60 ? '前' : (r < 0.85 ? '追' : '殿'));
        return r < 0.25 ? '前' : (r < 0.65 ? '追' : '殿');
    }

    getResults() {
        if (!this.simulator) return [];
        return this.simulator.getResults().map(res => {
            const gameHorse = this.gameHorses.find(h => h.id === res.horse.id);
            return {
                horseId: res.horse.id,
                horseName: res.horse.name,
                rank: res.position,
                finishTime: res.finishTime,
                odds: gameHorse?.odds || 0,
                ...gameHorse
            };
        });
    }

    isFinished() { return !this.isRunning; }
}
