// ====================================
// Race Replay Viewer
// 比賽重播播放器
// ====================================

class RaceReplayViewer {
    constructor(canvas, replayData, trackData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.replayData = replayData;
        this.trackData = trackData;

        this.currentFrameIndex = 0;
        this.isPlaying = false;
        this.playbackSpeed = 1.0;
        this.animationId = null;

        // 創建賽道路徑（用於渲染）
        this.trackPath = this.createStadiumPath();

        // 回調函數
        this.onTimeUpdate = null;
        this.onPlayStateChange = null;
    }

    // ====================================
    // 播放控制
    // ====================================

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.animate();
        if (this.onPlayStateChange) this.onPlayStateChange(true);
    }

    pause() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.onPlayStateChange) this.onPlayStateChange(false);
    }

    stop() {
        this.pause();
        this.currentFrameIndex = 0;
        this.render();
    }

    seekTo(time) {
        // 找到最接近目標時間的幀
        const frameIndex = this.findFrameByTime(time);
        if (frameIndex !== -1) {
            this.currentFrameIndex = frameIndex;
            this.render();
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.getCurrentTime(), this.getTotalDuration());
            }
        }
    }

    seekToFrame(frameIndex) {
        if (frameIndex >= 0 && frameIndex < this.replayData.trajectory.length) {
            this.currentFrameIndex = frameIndex;
            this.render();
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.getCurrentTime(), this.getTotalDuration());
            }
        }
    }

    setSpeed(speed) {
        this.playbackSpeed = Math.max(0.25, Math.min(4, speed));
    }

    // ====================================
    // 動畫循環
    // ====================================

    animate() {
        if (!this.isPlaying) return;

        const frameDuration = 100 / this.playbackSpeed; // 基礎: 100ms/幀 (對應0.1秒採樣)

        this.animationId = requestAnimationFrame(() => {
            this.currentFrameIndex++;

            // 檢查是否到達結尾
            if (this.currentFrameIndex >= this.replayData.trajectory.length) {
                this.currentFrameIndex = this.replayData.trajectory.length - 1;
                this.pause();
                return;
            }

            this.render();

            // 通知時間更新
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.getCurrentTime(), this.getTotalDuration());
            }

            // 繼續下一幀
            setTimeout(() => this.animate(), frameDuration);
        });
    }

    // ====================================
    // 渲染
    // ====================================

    render() {
        if (!this.replayData || !this.replayData.trajectory[this.currentFrameIndex]) {
            return;
        }

        const frame = this.replayData.trajectory[this.currentFrameIndex];

        // 清空畫布
        this.ctx.fillStyle = '#2d5016';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 設置縮放和平移（與 RaceEngineAdapter 一致）
        this.ctx.save();
        const scale = Math.min(
            this.canvas.width / 600,
            this.canvas.height / 400
        );
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(scale, scale);

        // 繪製賽道
        this.drawTrack();

        // 繪製起點/終點線
        this.drawStartFinishLine();

        // 繪製馬匹
        this.drawHorses(frame);

        this.ctx.restore();

        // 繪製排名信息
        this.drawLeaderboard(frame);
    }

    drawTrack() {
        if (!this.trackPath || this.trackPath.length === 0) return;

        // 外圍軌道線
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.trackPath.forEach((point, i) => {
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y - 100);
            } else {
                this.ctx.lineTo(point.x, point.y - 100);
            }
        });
        this.ctx.closePath();
        this.ctx.stroke();

        // 內圍軌道線
        this.ctx.beginPath();
        this.trackPath.forEach((point, i) => {
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y + 100);
            } else {
                this.ctx.lineTo(point.x, point.y + 100);
            }
        });
        this.ctx.closePath();
        this.ctx.stroke();

        // 中線（虛線）
        this.ctx.strokeStyle = '#ffffff80';
        this.ctx.setLineDash([5, 10]);
        this.ctx.beginPath();
        this.trackPath.forEach((point, i) => {
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        });
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawStartFinishLine() {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-115, -100);
        this.ctx.lineTo(-115, 100);
        this.ctx.stroke();

        // 標記
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('起點/終點', -115, -110);
    }

    drawHorses(frame) {
        frame.horses.forEach((horseData, index) => {
            const pos = this.getPositionOnTrack(horseData.s, horseData.d);

            // 馬匹顏色
            const colors = ['#ff4444', '#4444ff', '#44ff44', '#ffff44',
                '#ff44ff', '#44ffff', '#ffffff', '#ff8844'];
            const color = colors[index % colors.length];

            // 繪製馬匹（圓形）
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // 如果已完賽，加上標記
            if (horseData.finished) {
                this.ctx.strokeStyle = '#00ff00';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // 繪製編號
            this.ctx.fillStyle = '#000000';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText((index + 1).toString(), pos.x, pos.y);
        });
    }

    drawLeaderboard(frame) {
        // 恢復正常座標系統
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // 按 s 值排序（進度）
        const sortedHorses = [...frame.horses].sort((a, b) => b.s - a.s);

        // 繪製排名榜
        const boxX = 10;
        const boxY = 10;
        const boxWidth = 180;
        const boxHeight = 30 + sortedHorses.length * 25;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('當前排名', boxX + 10, boxY + 20);

        // 繪製各馬匹排名
        sortedHorses.forEach((horseData, rank) => {
            const y = boxY + 45 + rank * 25;

            // 排名
            this.ctx.fillStyle = rank < 3 ? '#ffd700' : '#ffffff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(`${rank + 1}.`, boxX + 10, y);

            // 編號
            const horseIndex = frame.horses.findIndex(h => h.id === horseData.id);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`#${horseIndex + 1}`, boxX + 35, y);

            // 進度
            const progress = ((horseData.s / 1000) * 100).toFixed(0);
            this.ctx.fillText(`${progress}%`, boxX + 70, y);

            // 完賽標記
            if (horseData.finished) {
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillText('✓', boxX + 120, y);
            }
        });
    }

    // ====================================
    // 工具方法
    // ====================================

    getPositionOnTrack(s, d) {
        if (!this.trackPath || this.trackPath.length === 0) {
            return { x: 0, y: 0 };
        }

        // 計算路徑總長度
        const pathLength = this.calculatePathLength(this.trackPath);

        // 計算在路徑上的位置
        let targetLength = s % pathLength;
        let accumulatedLength = 0;

        for (let i = 0; i < this.trackPath.length; i++) {
            const p1 = this.trackPath[i];
            const p2 = this.trackPath[(i + 1) % this.trackPath.length];
            const segmentLength = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

            if (accumulatedLength + segmentLength >= targetLength) {
                const t = (targetLength - accumulatedLength) / segmentLength;
                const baseX = p1.x + (p2.x - p1.x) * t;
                const baseY = p1.y + (p2.y - p1.y) * t;

                // 計算垂直偏移（d）
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const perpAngle = angle + Math.PI / 2;

                return {
                    x: baseX + Math.cos(perpAngle) * d,
                    y: baseY + Math.sin(perpAngle) * d
                };
            }

            accumulatedLength += segmentLength;
        }

        return { x: this.trackPath[0].x, y: this.trackPath[0].y };
    }

    findFrameByTime(targetTime) {
        if (!this.replayData || !this.replayData.trajectory) return -1;

        for (let i = 0; i < this.replayData.trajectory.length; i++) {
            if (this.replayData.trajectory[i].time >= targetTime) {
                return i;
            }
        }

        return this.replayData.trajectory.length - 1;
    }

    getCurrentTime() {
        if (!this.replayData || !this.replayData.trajectory[this.currentFrameIndex]) {
            return 0;
        }
        return this.replayData.trajectory[this.currentFrameIndex].time;
    }

    getTotalDuration() {
        return this.replayData?.duration || 0;
    }

    getCurrentProgress() {
        const total = this.replayData?.trajectory?.length || 1;
        return (this.currentFrameIndex / total) * 100;
    }

    // ====================================
    // 賽道生成（與 BackgroundSimulator 一致）
    // ====================================

    createStadiumPath() {
        const points = [];
        const straightLength = 230;
        const cornerRadius = 100;
        const centerX = 0;
        const centerY = 0;
        const numPointsPerSegment = 40;

        // 上直線
        for (let i = 0; i <= numPointsPerSegment; i++) {
            const t = i / numPointsPerSegment;
            points.push({
                x: centerX - straightLength / 2 + t * straightLength,
                y: centerY - cornerRadius
            });
        }

        // 右彎道
        for (let i = 1; i <= numPointsPerSegment; i++) {
            const t = i / numPointsPerSegment;
            const angle = -Math.PI / 2 + t * Math.PI;
            points.push({
                x: centerX + straightLength / 2 + Math.cos(angle) * cornerRadius,
                y: centerY + Math.sin(angle) * cornerRadius
            });
        }

        // 下直線
        for (let i = 1; i <= numPointsPerSegment; i++) {
            const t = i / numPointsPerSegment;
            points.push({
                x: centerX + straightLength / 2 - t * straightLength,
                y: centerY + cornerRadius
            });
        }

        // 左彎道
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

    calculatePathLength(path) {
        let length = 0;
        for (let i = 1; i < path.length; i++) {
            const dx = path[i].x - path[i - 1].x;
            const dy = path[i].y - path[i - 1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        const last = path[path.length - 1];
        const first = path[0];
        length += Math.sqrt((first.x - last.x) ** 2 + (first.y - last.y) ** 2);
        return length;
    }

    // ====================================
    // 清理
    // ====================================

    destroy() {
        this.pause();
        this.canvas = null;
        this.ctx = null;
        this.replayData = null;
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RaceReplayViewer;
}
