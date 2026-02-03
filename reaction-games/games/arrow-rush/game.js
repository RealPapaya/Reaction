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

        // Modal elements
        this.rulesModal = document.getElementById('rules-modal');
        this.btnRules = document.getElementById('btn-rules');
        this.closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');

        // Game state
        this.isPlaying = false;
        this.isPaused = false;
        this.isFrozen = false;
        this.score = 0;
        this.combo = 0;
        this.timeLeft = 30;
        this.arrowQueue = []; // Queue of arrows
        this.totalHits = 0;
        this.totalAttempts = 0;

        // Game config
        this.BLOCK_SIZE = 120; // 放大箭頭
        this.FREEZE_DURATION = 500; // 僵直 0.5 秒

        // Direction config
        this.DIRECTIONS = ['up', 'down', 'left', 'right'];
        this.DIRECTION_SYMBOLS = {
            up: '↑',
            down: '↓',
            left: '←',
            right: '→'
        };
        this.DIRECTION_COLORS = {
            up: '#0EA5E9',    // Vivid Sky Blue
            down: '#F97316',  // Vivid Orange
            left: '#22C55E',  // Vivid Green
            right: '#EF4444'  // Vivid Red
        };
        this.KEY_MAP = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };

        // Animation
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

        // Modal listeners
        this.btnRules.addEventListener('click', () => this.openRules());
        this.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeRules());
        });
        window.addEventListener('click', (e) => {
            if (e.target === this.rulesModal) {
                this.closeRules();
            }
        });

        // Keyboard listener
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);

        // Display stats
        this.displayStats();

        // Draw初始畫面
        this.drawInitialScreen();

        // Show rules on load
        this.openRules();
    }

    openRules() {
        this.rulesModal.classList.add('show');
        if (this.isPlaying && !this.isPaused) {
            // Optional: Pause game if rules opened during play (though button might be hidden or we want to pause)
            // effective pause logic not fully implemented but game relies on timer.
            // For now, assume rules are mostly for pre-game.
        }
    }

    closeRules() {
        this.rulesModal.classList.remove('show');
    }

    drawInitialScreen() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
        this.totalHits = 0;
        this.totalAttempts = 0;

        // Update UI
        this.updateUI();

        // Generate initial arrows
        this.arrowQueue = [];
        for (let i = 0; i < 6; i++) {
            this.arrowQueue.push(this.getRandomDirection());
        }

        // Start timer
        this.startTimer();

        // Initial render
        this.render();
    }

    addNextArrow() {
        this.arrowQueue.push(this.getRandomDirection());
    }

    getRandomDirection() {
        return this.DIRECTIONS[Math.floor(Math.random() * this.DIRECTIONS.length)];
    }

    handleKeyDown(e) {
        if (!this.isPlaying || this.isFrozen || this.isPaused) return;

        const direction = this.KEY_MAP[e.key];
        if (!direction) return;

        e.preventDefault();

        // Visual feedback
        this.highlightKey(e.key);

        // Check hit
        this.totalAttempts++;
        if (this.arrowQueue.length > 0 && direction === this.arrowQueue[0]) {
            this.handleHit();
        } else {
            this.handleMiss();
        }
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

        // Update Queue
        this.arrowQueue.shift();
        this.addNextArrow();

        // Update UI logic
        this.updateUI();
        this.render();
    }

    handleMiss() {
        // Penalty
        this.score = Math.max(0, this.score - 5);
        this.combo = 0;

        // Freeze
        this.freeze();

        // Update UI
        this.updateUI();
        this.render();
    }



    freeze() {
        this.isFrozen = true;
        this.canvas.classList.add('frozen');

        setTimeout(() => {
            this.isFrozen = false;
            this.canvas.classList.remove('frozen');
            this.render(); // Re-render to clear frozen state
        }, this.FREEZE_DURATION);
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.isPlaying || this.arrowQueue.length === 0) return;

        // Draw queue (stack)
        // Target (index 0) is at the bottom center
        const startY = this.canvas.height - 150;

        // Draw from last to first
        for (let i = this.arrowQueue.length - 1; i >= 0; i--) {
            const isTarget = i === 0;
            const size = isTarget ? this.BLOCK_SIZE : 80;
            const spacing = 100;

            const cx = this.canvas.width / 2;
            const cy = startY - (i * spacing);

            const x = cx - size / 2;
            const y = cy - size / 2;

            // Skip drawing if off-screen top
            if (y + size < 0) continue;

            const direction = this.arrowQueue[i];

            // Color logic
            const color = this.isFrozen ? '#9CA3AF' : this.DIRECTION_COLORS[direction];

            // Draw Box
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, size, size);

            // Border
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = isTarget ? 4 : 2;
            this.ctx.strokeRect(x, y, size, size);

            // Shadow effect (only for target?)
            if (isTarget) {
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(x + 8, y + 8, size, size);
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, y, size, size);
                this.ctx.strokeRect(x, y, size, size);
            }

            // Arrow Symbol
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = `bold ${isTarget ? 64 : 40}px Fredoka, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                this.DIRECTION_SYMBOLS[direction],
                x + size / 2,
                y + size / 2 + (isTarget ? 5 : 3)
            );

            // Frozen "X" overlay on target
            if (isTarget && this.isFrozen) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                this.ctx.font = 'bold 80px sans-serif';
                this.ctx.fillText('X', x + size / 2, y + size / 2 + 5);
            }
        }
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
        // cancelAnimationFrame(this.animationId); // No longer used

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
        if (this.score >= 1000) {
            rating = '大師級！🏆';
        } else if (this.score >= 750) {
            rating = '優秀！⭐';
        } else if (this.score >= 500) {
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
