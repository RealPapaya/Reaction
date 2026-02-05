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

        // 🎯 物理-視覺比例轉換 (與測試模擬器一致)
        this.PIXELS_PER_METER = 2.2;
        this.VISUAL_SCALE = 3.0;
        this.HORSE_PHYSICAL_LENGTH = 2.0;
        this.HORSE_PHYSICAL_WIDTH = 1.2;
        this.HORSE_VISUAL_LENGTH = this.HORSE_PHYSICAL_LENGTH * this.PIXELS_PER_METER * this.VISUAL_SCALE;
        this.HORSE_VISUAL_WIDTH = this.HORSE_PHYSICAL_WIDTH * this.PIXELS_PER_METER * this.VISUAL_SCALE;

        // 如果提供了參數，直接啟動 (相容舊介面)
        if (canvas && horses && trackData) {
            this.startRace(horses, trackData);
        }
    }

    // ====================================
    // 主要 API
    // ====================================

    startRace(gameHorses, trackData) {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.gameHorses = gameHorses;

        // 如果已經在準備模式，複用模擬器
        if (!this.simulator) {
            const rawPath = this.createStadiumPath();
            const simulatorHorses = this.convertHorsesToSimulatorFormat(gameHorses);
            this.simulator = new RaceSimulator(rawPath, simulatorHorses);
            this.trackPath = rawPath;
        }

        this.simulator.startRace();
        this.isRunning = true;
        this.isPreparing = false; // 切換為正式比賽
        this.animate();
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

        const rawPath = this.createStadiumPath();
        const simulatorHorses = this.convertHorsesToSimulatorFormat(gameHorses);

        this.simulator = new RaceSimulator(rawPath, simulatorHorses);
        this.trackPath = rawPath;

        // 初始化馬匹位置但不啟動比賽
        this.simulator.initializeHorses();

        this.isRunning = true;
        this.animate();
    }

    /**
     * 🎯 1:1 同步：建立操場型賽道 (Stadium Path)
     */
    createStadiumPath() {
        const points = [];
        // 為了適應 1000px 畫布，微調物理尺寸但保持比例 (PIXELS_PER_METER = 2.2)
        const straightLength = 230;
        const cornerRadius = 100;
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
        if (this.simulator) this.simulator.stopRace();
        this.isRunning = false;
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
    }

    /**
     * 🎯 繪製中央大型倒數計時器
     */
    renderCountdown() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        this.ctx.save();

        // 半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        this.ctx.fill();

        // 文字發光效果
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#8B5CF6';

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 64px "Segoe UI", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.countdownText, cx, cy);

        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('距離開賽', cx, cy - 45);

        this.ctx.restore();
    }

    drawTrackBase(trackPath) {
        if (!trackPath || trackPath.length === 0) return;

        // 🎯 1:1 同步：白邊賽道
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 40;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        trackPath.forEach((p, i) => {
            const pos = this.physicsToCanvas(p.x, p.y);
            if (i === 0) this.ctx.moveTo(pos.x, pos.y);
            else this.ctx.lineTo(pos.x, pos.y);
        });
        this.ctx.closePath();
        this.ctx.stroke();

        // 內場草地
        this.ctx.fillStyle = '#7EC850';
        this.ctx.fill();

        // 外圍土色（裝飾感）
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 44;
        this.ctx.stroke();

        // 起點線
        const startPos = this.physicsToCanvas(trackPath[0].x, trackPath[0].y);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(startPos.x - 2, startPos.y - 45, 4, 90);

        // 🎯 1:1 同步：跑道間隔線 (Lane lines)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        for (let lane = 1; lane < 8; lane++) {
            const laneD = lane * 2.1;
            this.ctx.beginPath();
            trackPath.forEach((p, i) => {
                const s = i * (this.simulator.frenet.pathLength / trackPath.length);
                const worldPos = this.simulator.frenet.frenetToWorld(s, laneD);
                const pos = this.physicsToCanvas(worldPos.x, worldPos.y);
                if (i === 0) this.ctx.moveTo(pos.x, pos.y);
                else this.ctx.lineTo(pos.x, pos.y);
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
                this.ctx.lineWidth = 1;
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
            this.ctx.ellipse(canvasPos.x + 3, canvasPos.y + 3, 10, 6, horse.heading || 0, 0, Math.PI * 2);
            this.ctx.fill();

            // 3. 🎯 1:1 同步：馬匹矩形
            this.ctx.save();
            this.ctx.translate(canvasPos.x, canvasPos.y);
            this.ctx.rotate(horse.heading || 0);
            this.ctx.fillStyle = mainColor;
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.fillRect(-this.HORSE_VISUAL_LENGTH / 2, -this.HORSE_VISUAL_WIDTH / 2, this.HORSE_VISUAL_LENGTH, this.HORSE_VISUAL_WIDTH);
            this.ctx.strokeRect(-this.HORSE_VISUAL_LENGTH / 2, -this.HORSE_VISUAL_WIDTH / 2, this.HORSE_VISUAL_LENGTH, this.HORSE_VISUAL_WIDTH);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(horse.id, 0, 0);
            this.ctx.restore();

            // 4. 🎯 1:1 同步：標籤引線邏輯 (Leash toward center)
            const rankInfo = leaderboard.find(l => l.horseId === horse.id);
            const rank = rankInfo ? rankInfo.position : '?';

            const centerCanvas = this.physicsToCanvas(0, 0);
            const dx = centerCanvas.x - canvasPos.x;
            const dy = centerCanvas.y - canvasPos.y;
            const distToCenter = Math.sqrt(dx * dx + dy * dy);

            // 標籤定位 (1:1 同步 test-simulator)
            const labelDistance = 85;
            const lx = canvasPos.x + (dx / distToCenter) * labelDistance;
            const ly = canvasPos.y + (dy / distToCenter) * labelDistance;

            this.ctx.strokeStyle = mainColor;
            this.ctx.lineWidth = 1.2;
            this.ctx.beginPath();
            this.ctx.moveTo(canvasPos.x, canvasPos.y);
            this.ctx.lineTo(lx, ly);
            this.ctx.stroke();

            const labelText = `${rank}. #${horse.id} ${horse.name}`;
            this.ctx.font = 'bold 11px Arial';
            const tw = this.ctx.measureText(labelText).width;

            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.fillRect(lx - tw / 2 - 4, ly - 8, tw + 8, 16);
            this.ctx.fillStyle = '#fff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(labelText, lx, ly);
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
