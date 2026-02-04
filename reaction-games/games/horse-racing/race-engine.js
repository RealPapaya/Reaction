// ====================================
// Race Engine - Handles race simulation
// ====================================

class RaceEngine {
    constructor(canvas, horses) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.horses = horses;

        // Track settings
        this.trackLength = canvas.width - 100;
        this.laneHeight = 55;
        this.startX = 50;

        // Race state
        this.isRacing = false;
        this.animationId = null;
        this.raceStartTime = 0;
        this.raceDuration = 30000; // 30 seconds

        // Results
        this.finishOrder = [];
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
            horse.position = 0;
            // Calculate base speed from competitive factor
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
                // Random speed variation
                const speedVar = randomFloat(0.95, 1.05);
                const increment = (horse.speed / 100) * speedVar;
                horse.progress = Math.min(horse.progress + increment, 1);

                // Update position on track
                horse.position = horse.progress * this.trackLength;

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

        // Draw background
        this.ctx.fillStyle = '#F3F4F6';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw lanes
        this.drawLanes();

        // Draw finish line
        this.drawFinishLine();

        // Draw horses
        this.horses.forEach((horse, index) => {
            this.drawHorse(horse, index);
        });

        // Draw start line
        this.drawStartLine();
    }

    drawLanes() {
        this.ctx.strokeStyle = '#D1D5DB';
        this.ctx.lineWidth = 2;

        for (let i = 0; i <= 8; i++) {
            const y = i * this.laneHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawStartLine() {
        this.ctx.strokeStyle = '#16A34A';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, 0);
        this.ctx.lineTo(this.startX, this.canvas.height);
        this.ctx.stroke();

        // Label
        this.ctx.fillStyle = '#16A34A';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('起點', 10, 20);
    }

    drawFinishLine() {
        const finishX = this.startX + this.trackLength;

        // Checkered pattern
        this.ctx.fillStyle = '#000000';
        const squareSize = 10;
        for (let y = 0; y < this.canvas.height; y += squareSize) {
            for (let x = 0; x < squareSize * 2; x += squareSize) {
                if ((y / squareSize + x / squareSize) % 2 === 0) {
                    this.ctx.fillRect(finishX - squareSize + x, y, squareSize, squareSize);
                }
            }
        }

        // Label
        this.ctx.fillStyle = '#DC2626';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('終點', finishX + 5, 20);
    }

    drawHorse(horse, laneIndex) {
        const y = laneIndex * this.laneHeight + this.laneHeight / 2;
        const x = this.startX + horse.position;

        // Draw lane background
        if (laneIndex % 2 === 0) {
            this.ctx.fillStyle = 'rgba(249, 115, 22, 0.05)';
            this.ctx.fillRect(0, laneIndex * this.laneHeight, this.canvas.width, this.laneHeight);
        }

        // Draw horse emoji
        this.ctx.font = '32px Arial';
        this.ctx.fillText('🏇', x - 16, y + 10);

        // Draw horse number
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x - 8, y - 20, 16, 16);
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - 8, y - 20, 16, 16);

        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(horse.id, x, y - 8);
        this.ctx.textAlign = 'left';

        // Draw horse name on left
        this.ctx.fillStyle = '#4B5563';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText(`${horse.id}. ${horse.name}`, 5, y + 5);
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
