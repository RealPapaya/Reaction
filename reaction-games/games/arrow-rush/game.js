/**
 * Arrow Rush Game - JavaScript Logic
 * 30-second direction key rhythm challenge
 */

class ArrowRushGame {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // DOM Elements
        this.scoreEl = document.getElementById('score');
        this.timeEl = document.getElementById('time');
        this.comboEl = document.getElementById('combo');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.result = document.getElementById('result');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');

        // Stats elements
        this.totalPlaysEl = document.getElementById('total-plays');
        this.highScoreEl = document.getElementById('high-score');
        this.maxComboEl = document.getElementById('max-combo');
        this.accuracyEl = document.getElementById('accuracy');
        this.clearStatsBtn = document.getElementById('clear-stats');

        // Game state
        this.isPlaying = false;
        this.isPaused = false;
        this.isFrozen = false;
        this.score = 0;
        this.combo = 0;
        this.timeLeft = 30;
        this.blocks = [];
        this.totalHits = 0;
        this.totalAttempts = 0;

        // Game config
        this.BLOCK_SIZE = 80;
        this.BLOCK_SPACING = 120;
        this.FALL_SPEED = 2.5;
        this.VISIBLE_BLOCKS = 5;
        this.TARGET_Y = this.canvas.height - 120; // Judgment line position
        this.FREEZE_DURATION = 500; // 0.5 seconds

        // Direction config
        this.DIRECTIONS = ['up', 'down', 'left', 'right'];
        this.DIRECTION_SYMBOLS = {
            up: '↑',
            down: '↓',
            left: '←',
            right: '→'
        };
        this.DIRECTION_COLORS = {
            up: '#4F46E5',    // Indigo
            down: '#F97316',  // Orange
            left: '#22C55E',  // Green
            right: '#E11D48'  // Red
        };
        this.KEY_MAP = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };

        // Animation
        this.animationId = null;
        this.timerInterval = null;

        // Stats from localStorage
        this.stats = this.loadStats();

        // Initialize
        this.init();
    }

    init() {
        // Event listeners
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.resetGame());
        this.clearStatsBtn.addEventListener('click', () => this.clearStats());

        // Keyboard listener
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);

        // Display stats
        this.displayStats();

        // Draw初始畫面
        this.drawInitialScreen();
    }

    drawInitialScreen() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw judgment line
        this.drawJudgmentLine();

        // Draw text
        this.ctx.fillStyle = '#1E1B4B';
        this.ctx.font = 'bold 24px Fredoka, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('點擊「開始遊戲」', this.canvas.width / 2, this.canvas.height / 2);
    }

    startGame() {
        // Hide/show buttons
        this.startBtn.classList.add('hidden');
        this.restartBtn.classList.add('hidden');
        this.result.classList.add('hidden');

        // Reset state
        this.isPlaying = true;
        this.isPaused = false;
        this.isFrozen = false;
        this.score = 0;
        this.combo = 0;
        this.timeLeft = 30;
        this.blocks = [];
        this.totalHits = 0;
        this.totalAttempts = 0;

        // Update UI
        this.updateUI();

        // Generate initial blocks
        this.generateInitialBlocks();

        // Start timer
        this.startTimer();

        // Start game loop
        this.gameLoop();
    }

    generateInitialBlocks() {
        // Generate 5 initial blocks
        for (let i = 0; i < this.VISIBLE_BLOCKS; i++) {
            const block = {
                direction: this.getRandomDirection(),
                y: -this.BLOCK_SPACING * (this.VISIBLE_BLOCKS - i - 1) - this.BLOCK_SIZE,
                isTarget: i === this.VISIBLE_BLOCKS - 1
            };
            this.blocks.push(block);
        }
    }

    getRandomDirection() {
        return this.DIRECTIONS[Math.floor(Math.random() * this.DIRECTIONS.length)];
    }

    addNewBlock() {
        // Add new block at the top
        const topY = this.blocks.length > 0
            ? this.blocks[0].y - this.BLOCK_SPACING
            : -this.BLOCK_SIZE;

        const block = {
            direction: this.getRandomDirection(),
            y: topY,
            isTarget: false
        };

        this.blocks.unshift(block);
    }

    handleKeyDown(e) {
        if (!this.isPlaying || this.isFrozen || this.isPaused) return;

        const direction = this.KEY_MAP[e.key];
        if (!direction) return;

        e.preventDefault();

        // Visual feedback
        this.highlightKey(e.key);

        // Check hit
        this.checkHit(direction);
    }

    highlightKey(key) {
        const keyBoxes = document.querySelectorAll('.key-box');
        const keyMap = {
            'ArrowUp': 0,
            'ArrowDown': 1,
            'ArrowLeft': 2,
            'ArrowRight': 3
        };

        const index = keyMap[key];
        if (index !== undefined && keyBoxes[index]) {
            keyBoxes[index].classList.add('active');
            setTimeout(() => {
                keyBoxes[index].classList.remove('active');
            }, 150);
        }
    }

    checkHit(direction) {
        // Find the target block (should be the last one visible)
        const targetBlock = this.blocks.find(b => b.isTarget);

        if (!targetBlock) return;

        // Check if block is in judgment range
        const distance = Math.abs(targetBlock.y - this.TARGET_Y);

        if (distance > 60) {
            // Too early or too late - treat as miss
            this.handleMiss();
            return;
        }

        this.totalAttempts++;

        if (targetBlock.direction === direction) {
            // Correct hit!
            this.handleHit();
        } else {
            // Wrong direction
            this.handleMiss();
        }
    }

    handleHit() {
        // Increment score and combo
        let points = 10;
        this.combo++;

        // Combo bonus
        if (this.combo >= 15) {
            points = Math.floor(points * 2);
        } else if (this.combo >= 10) {
            points = Math.floor(points * 1.75);
        } else if (this.combo >= 5) {
            points = Math.floor(points * 1.5);
        }

        this.score += points;
        this.totalHits++;

        // Remove the target block
        const targetIndex = this.blocks.findIndex(b => b.isTarget);
        if (targetIndex !== -1) {
            this.blocks.splice(targetIndex, 1);
        }

        // Set new target
        if (this.blocks.length > 0) {
            this.blocks[this.blocks.length - 1].isTarget = true;
        }

        // Add new block at top
        this.addNewBlock();

        // Update UI
        this.updateUI();
    }

    handleMiss() {
        // Penalty
        this.score = Math.max(0, this.score - 5);
        this.combo = 0;

        // Freeze for 0.5 seconds
        this.freeze();

        // Update UI
        this.updateUI();
    }

    freeze() {
        this.isFrozen = true;
        this.canvas.classList.add('frozen');

        setTimeout(() => {
            this.isFrozen = false;
            this.canvas.classList.remove('frozen');
        }, this.FREEZE_DURATION);
    }

    updateBlocks() {
        if (this.isFrozen) return;

        // Move all blocks down
        this.blocks.forEach(block => {
            block.y += this.FALL_SPEED;
        });

        // Remove blocks that are too far down
        this.blocks = this.blocks.filter(block => block.y < this.canvas.height + this.BLOCK_SIZE);

        // Ensure we always have 5 blocks
        while (this.blocks.length < this.VISIBLE_BLOCKS) {
            this.addNewBlock();
        }

        // Update target
        if (this.blocks.length > 0) {
            this.blocks.forEach(b => b.isTarget = false);
            // Find the block closest to target line
            let closestIndex = 0;
            let closestDistance = Math.abs(this.blocks[0].y - this.TARGET_Y);

            for (let i = 1; i < this.blocks.length; i++) {
                const distance = Math.abs(this.blocks[i].y - this.TARGET_Y);
                if (distance < closestDistance && this.blocks[i].y <= this.TARGET_Y + 60) {
                    closestDistance = distance;
                    closestIndex = i;
                }
            }

            this.blocks[closestIndex].isTarget = true;
        }
    }

    gameLoop() {
        if (!this.isPlaying) return;

        // Update
        this.updateBlocks();

        // Render
        this.render();

        // Continue loop
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw judgment line
        this.drawJudgmentLine();

        // Draw blocks
        this.blocks.forEach(block => {
            this.drawBlock(block);
        });
    }

    drawJudgmentLine() {
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 5;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(50, this.TARGET_Y);
        this.ctx.lineTo(this.canvas.width - 50, this.TARGET_Y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawBlock(block) {
        const x = this.canvas.width / 2 - this.BLOCK_SIZE / 2;
        const y = block.y;

        // Block background
        if (block.isTarget) {
            this.ctx.fillStyle = this.DIRECTION_COLORS[block.direction];
        } else {
            this.ctx.fillStyle = '#FFFFFF';
        }

        this.ctx.fillRect(x, y, this.BLOCK_SIZE, this.BLOCK_SIZE);

        // Border
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(x, y, this.BLOCK_SIZE, this.BLOCK_SIZE);

        // Shadow
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x + 6, y + 6, this.BLOCK_SIZE, this.BLOCK_SIZE);
        this.ctx.fillStyle = block.isTarget ? this.DIRECTION_COLORS[block.direction] : '#FFFFFF';
        this.ctx.fillRect(x, y, this.BLOCK_SIZE, this.BLOCK_SIZE);
        this.ctx.strokeRect(x, y, this.BLOCK_SIZE, this.BLOCK_SIZE);

        // Direction symbol
        this.ctx.fillStyle = block.isTarget ? '#FFFFFF' : this.DIRECTION_COLORS[block.direction];
        this.ctx.font = 'bold 48px Fredoka, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            this.DIRECTION_SYMBOLS[block.direction],
            x + this.BLOCK_SIZE / 2,
            y + this.BLOCK_SIZE / 2
        );
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateUI();

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        cancelAnimationFrame(this.animationId);

        // Update stats
        this.stats.totalPlays++;
        if (this.score > this.stats.highScore) {
            this.stats.highScore = this.score;
        }
        if (this.combo > this.stats.maxCombo) {
            this.stats.maxCombo = this.combo;
        }
        this.stats.totalHits += this.totalHits;
        this.stats.totalAttempts += this.totalAttempts;

        this.saveStats();
        this.displayStats();

        // Show result
        this.showResult();

        // Show restart button
        this.restartBtn.classList.remove('hidden');
    }

    showResult() {
        this.result.classList.remove('hidden');
        this.resultTitle.textContent = '⏱️ 時間到！';

        const accuracy = this.totalAttempts > 0
            ? Math.round((this.totalHits / this.totalAttempts) * 100)
            : 0;

        let rating = '';
        if (this.score >= 300) {
            rating = '大師級！🏆';
        } else if (this.score >= 200) {
            rating = '優秀！⭐';
        } else if (this.score >= 100) {
            rating = '不錯！👍';
        } else {
            rating = '繼續加油！💪';
        }

        this.resultMessage.innerHTML = `
      <p class="success">最終分數: ${this.score}</p>
      <p>最高連擊: <span class="highlight">${this.combo}</span></p>
      <p>命中率: <span class="highlight">${accuracy}%</span></p>
      <p>${rating}</p>
    `;
    }

    resetGame() {
        this.restartBtn.classList.add('hidden');
        this.result.classList.add('hidden');
        this.startBtn.classList.remove('hidden');

        // Clear canvas
        this.drawInitialScreen();
    }

    updateUI() {
        this.scoreEl.textContent = this.score;
        this.timeEl.textContent = `${this.timeLeft}s`;
        this.comboEl.textContent = this.combo;
    }

    // Stats management
    loadStats() {
        const saved = localStorage.getItem('arrowRushStats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            totalPlays: 0,
            highScore: 0,
            maxCombo: 0,
            totalHits: 0,
            totalAttempts: 0
        };
    }

    saveStats() {
        localStorage.setItem('arrowRushStats', JSON.stringify(this.stats));
    }

    displayStats() {
        this.totalPlaysEl.textContent = this.stats.totalPlays;
        this.highScoreEl.textContent = this.stats.highScore;
        this.maxComboEl.textContent = this.stats.maxCombo;

        const accuracy = this.stats.totalAttempts > 0
            ? Math.round((this.stats.totalHits / this.stats.totalAttempts) * 100)
            : 0;
        this.accuracyEl.textContent = this.stats.totalPlays > 0 ? `${accuracy}%` : '-';
    }

    clearStats() {
        if (confirm('確定要清除所有統計數據嗎？')) {
            this.stats = {
                totalPlays: 0,
                highScore: 0,
                maxCombo: 0,
                totalHits: 0,
                totalAttempts: 0
            };
            this.saveStats();
            this.displayStats();
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ArrowRushGame();
});
