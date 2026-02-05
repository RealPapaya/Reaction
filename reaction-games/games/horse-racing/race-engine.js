// ====================================
// Race Engine - Handles curved track simulation
// ====================================

class RaceEngine {
    constructor(canvas, horses, trackData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.horses = horses;
        this.trackData = trackData;

        // Track settings
        this.padding = 50;
        this.laneWidth = 40;

        // Convert normalized path points to canvas coordinates
        this.trackPath = this.convertPathToCanvas(trackData.pathPoints);
        this.trackLength = this.calculatePathLength(this.trackPath);

        // Race state
        this.isRacing = false;
        this.animationId = null;
        this.raceStartTime = 0;
        this.raceDuration = 30000; // 30 seconds

        // Results
        this.finishOrder = [];
    }

    // ====================================
    // Path Utilities
    // ====================================

    convertPathToCanvas(normalizedPoints) {
        const usableWidth = this.canvas.width - (this.padding * 2);
        const usableHeight = this.canvas.height - (this.padding * 2);

        return normalizedPoints.map(point => ({
            x: this.padding + (point.x * usableWidth),
            y: this.padding + (point.y * usableHeight)
        }));
    }

    calculatePathLength(path) {
        let length = 0;
        for (let i = 1; i < path.length; i++) {
            const dx = path[i].x - path[i - 1].x;
            const dy = path[i].y - path[i - 1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }

    getPositionOnPath(progress, offset = 0) {
        // progress: 0 to 1 along the track
        // offset: perpendicular offset from center line (for lanes)

        const targetDistance = progress * this.trackLength;
        let currentDistance = 0;

        for (let i = 1; i < this.trackPath.length; i++) {
            const p1 = this.trackPath[i - 1];
            const p2 = this.trackPath[i];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const segmentLength = Math.sqrt(dx * dx + dy * dy);

            if (currentDistance + segmentLength >= targetDistance) {
                // Position is on this segment
                const segmentProgress = (targetDistance - currentDistance) / segmentLength;
                const x = p1.x + (dx * segmentProgress);
                const y = p1.y + (dy * segmentProgress);

                // Calculate perpendicular offset for lanes
                if (offset !== 0) {
                    const angle = Math.atan2(dy, dx);
                    const perpAngle = angle + Math.PI / 2;
                    return {
                        x: x + Math.cos(perpAngle) * offset,
                        y: y + Math.sin(perpAngle) * offset,
                        angle: angle
                    };
                }

                return { x, y, angle: Math.atan2(dy, dx) };
            }

            currentDistance += segmentLength;
        }

        // Return last point if beyond track
        const lastPoint = this.trackPath[this.trackPath.length - 1];
        return { x: lastPoint.x, y: lastPoint.y, angle: 0 };
    }

    // ====================================
    // Race Simulation
    // ====================================

    startRace() {
        this.isRunning = true;
        this.raceStartTime = Date.now();
        this.finishOrder = [];

        // Reset horse progress
        this.horses.forEach(horse => {
            horse.progress = 0;
            // 使用 competitiveFactor (已包含走勢、負磅、狀態等所有因素)
            horse.speed = horse.competitiveFactor * randomFloat(0.8, 1.2);
            horse.finishTime = null;
        });

        // Start animation
        this.update();
    }

    stopRace() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isRunning = false;
    }

    update() {
        if (!this.isRunning) return;

        const now = Date.now();
        const elapsed = (now - this.startTime) / 1000;

        // Update horse positions
        this.horses.forEach(horse => {
            if (horse.progress < 1) {
                // 使用 competitiveFactor (已包含所有專業因素)
                const speed = horse.competitiveFactor * 0.035; // Speed factor
                horse.progress += speed;

                if (horse.progress >= 1) {
                    horse.progress = 1;
                    horse.finishTime = elapsed;
                    this.finishOrder.push(horse); // Add to finish order when finished
                }
            }
        });

        // Check if all finished
        const allFinished = this.horses.every(h => h.progress >= 1);
        if (allFinished) {
            this.isRunning = false;
        }

        this.render();

        if (this.isRunning) {
            this.animationId = requestAnimationFrame(() => this.update());
        }
    }

    // ====================================
    // Canvas Rendering
    // ====================================

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#7EC850';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw straight track (simple version)
        const trackWidth = this.canvas.width - 100;
        const trackHeight = this.canvas.height - 100;
        const trackX = 50;
        const trackY = 50;

        // Track outline
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(trackX, trackY, trackWidth, trackHeight);

        // Center divider
        this.ctx.beginPath();
        this.ctx.moveTo(trackX + trackWidth / 2, trackY);
        this.ctx.lineTo(trackX + trackWidth / 2, trackY + trackHeight);
        this.ctx.stroke();

        // Draw horses
        const laneHeight = trackHeight / this.horses.length;

        this.horses.forEach((horse, index) => {
            const laneY = trackY + (index * laneHeight) + (laneHeight / 2);
            const horseX = trackX + (horse.progress * trackWidth);

            // Draw horse as colored square with number
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
            this.ctx.fillStyle = colors[index % colors.length];
            this.ctx.fillRect(horseX - 10, laneY - 10, 20, 20);

            // Draw horse number
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(horse.id, horseX, laneY + 5);

            // Draw horse name
            this.ctx.fillStyle = '#000';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(horse.name, horseX, laneY - 15);
        });

        // Draw finish line
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(trackX + trackWidth - 20, trackY);
        this.ctx.lineTo(trackX + trackWidth - 20, trackY + trackHeight);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawStartFinishLine() {
        // Draw at the 0/1 position of the track
        const startPos = this.trackPath[0];

        // Checkered flag pattern
        this.ctx.fillStyle = '#000000';
        const squareSize = 8;
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 4; j++) {
                if ((i + j) % 2 === 0) {
                    this.ctx.fillRect(
                        startPos.x - 20 + (j * squareSize),
                        startPos.y - 20 + (i * squareSize),
                        squareSize,
                        squareSize
                    );
                }
            }
        }

        // Label
        this.ctx.fillStyle = '#DC2626';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('起點/終點', startPos.x, startPos.y - 30);
        this.ctx.textAlign = 'left';
    }

    drawHorse(horse, laneIndex) {
        // Calculate lane offset (from center, each horse in a different lane)
        const laneOffset = -this.laneWidth * (4 - laneIndex);

        // Get position on track
        const pos = this.getPositionOnPath(horse.progress, laneOffset);

        // Draw horse emoji with rotation
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate(pos.angle);

        // Horse emoji
        this.ctx.font = '28px Arial';
        this.ctx.fillText('🏇', -14, 8);

        this.ctx.restore();

        // Draw horse number badge
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(pos.x - 10, pos.y - 25, 20, 18);
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(pos.x - 10, pos.y - 25, 20, 18);

        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(horse.id, pos.x, pos.y - 11);
        this.ctx.textAlign = 'left';
    }

    // ====================================
    // Get Results
    // ====================================

    getResults() {
        return this.finishOrder.map((horse, index) => ({
            position: index + 1,
            horse: horse
        }));
    }
}
