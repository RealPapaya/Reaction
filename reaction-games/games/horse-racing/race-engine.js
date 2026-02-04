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
        this.isRacing = true;
        this.raceStartTime = Date.now();
        this.finishOrder = [];

        // Reset horse progress
        this.horses.forEach(horse => {
            horse.progress = 0;
            horse.speed = horse.competitiveFactor * randomFloat(0.8, 1.2);
        });

        // Start animation
        this.animate();
    }

    animate() {
        if (!this.isRacing) return;

        const elapsed = Date.now() - this.raceStartTime;
        const progress = Math.min(elapsed / this.raceDuration, 1);

        // Update each horse's progress
        this.horses.forEach(horse => {
            if (horse.progress < 1) {
                const speedVar = randomFloat(0.95, 1.05);
                const increment = (horse.speed / 100) * speedVar;
                horse.progress = Math.min(horse.progress + increment, 1);

                // Check if finished
                if (horse.progress >= 1 && !this.finishOrder.includes(horse)) {
                    this.finishOrder.push(horse);
                }
            }
        });

        // Render
        this.render();

        // Check if race is complete
        if (this.finishOrder.length === this.horses.length || progress >= 1) {
            this.endRace();
        } else {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    endRace() {
        this.isRacing = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Ensure all horses are in finish order
        this.horses.forEach(horse => {
            if (!this.finishOrder.includes(horse)) {
                this.finishOrder.push(horse);
            }
        });
    }

    // ====================================
    // Canvas Rendering
    // ====================================

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background based on surface type
        this.drawBackground();

        // Draw track outline
        this.drawTrack();

        // Draw start/finish line
        this.drawStartFinishLine();

        // Draw horses
        this.horses.forEach((horse, index) => {
            this.drawHorse(horse, index);
        });
    }

    drawBackground() {
        // Background color based on track surface
        if (this.trackData.surface === 'turf') {
            this.ctx.fillStyle = '#86EFAC'; // Grass green
        } else {
            this.ctx.fillStyle = '#D4A574'; // Dirt brown
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawTrack() {
        // Draw outer track boundary
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();
        this.trackPath.forEach((point, index) => {
            if (index === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        });
        this.ctx.closePath();
        this.ctx.stroke();

        // Draw inner track boundary (slightly smaller)
        const innerOffset = -this.laneWidth * 4;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.trackPath.forEach((point, index) => {
            const innerPos = this.getPositionOnPath(index / (this.trackPath.length - 1), innerOffset);
            if (index === 0) {
                this.ctx.moveTo(innerPos.x, innerPos.y);
            } else {
                this.ctx.lineTo(innerPos.x, innerPos.y);
            }
        });
        this.ctx.closePath();
        this.ctx.stroke();

        // Draw lane dividers
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);

        for (let lane = 1; lane < 8; lane++) {
            const offset = -this.laneWidth * (4 - lane);
            this.ctx.beginPath();
            this.trackPath.forEach((point, index) => {
                const lanePos = this.getPositionOnPath(index / (this.trackPath.length - 1), offset);
                if (index === 0) {
                    this.ctx.moveTo(lanePos.x, lanePos.y);
                } else {
                    this.ctx.lineTo(lanePos.x, lanePos.y);
                }
            });
            this.ctx.stroke();
        }

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
