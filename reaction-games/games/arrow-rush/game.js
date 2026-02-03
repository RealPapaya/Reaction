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
        this.comboMultiplierEl = document.getElementById('combo-multiplier');
        this.restartBtn = document.getElementById('restart-btn');
        this.result = document.getElementById('result');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');

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
        this.canvas.addEventListener('click', () => {
            if (!this.isPlaying) {
                this.startGame();
            }
        });
        this.restartBtn.addEventListener('click', () => this.resetGame());


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
        this.ctx.fillText('點擊畫面開始遊戲', this.canvas.width / 2, this.canvas.height / 2);
    }

    startGame() {
        // Hide/show buttons
        this.restartBtn.classList.add('hidden');
        this.result.classList.add('hidden');

        // Show countdown
        this.showCountdown();
    }

    showCountdown() {
        let countdown = 3;
        this.isPlaying = false; // Prevent input during countdown

        const countdownInterval = setInterval(() => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw countdown number
            this.ctx.fillStyle = '#F97316';
            this.ctx.font = 'bold 120px Fredoka, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(countdown, this.canvas.width / 2, this.canvas.height / 2);

            countdown--;

            if (countdown < 0) {
                clearInterval(countdownInterval);
                this.startGamePlay();
            }
        }, 1000);
    }

    startGamePlay() {
        // Add playing class
        this.canvas.classList.add('playing');

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
        this.combo++;

        // Calculate Multiplier
        // 0-5: x1.0
        // 6-10: x1.1
        // 11-15: x1.2
        // Formula: 1 + max(0, floor((combo - 1) / 5)) * 0.1
        const multiplier = 1 + Math.max(0, Math.floor((this.combo - 1) / 5)) * 0.1;

        // Points calculation
        const points = Math.floor(10 * multiplier);

        this.score += points;
        this.totalHits++;

        // Visual feedback for multiplier update
        // Show update animation every 5 hits (when modulo 5 == 1, e.g., 1, 6, 11)
        // Or just whenever multiplier changes? Multiplier changes at 6, 11, 16.
        if ((this.combo - 1) % 5 === 0 && this.combo > 1) {
            this.comboMultiplierEl.classList.remove('shake');
            void this.comboMultiplierEl.offsetWidth; // trigger reflow
            this.comboMultiplierEl.classList.add('shake');
        }

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
      <button id="show-leaderboard-btn-arrow" class="btn btn-primary" style="margin-top: 1rem;">🏆 提交到排行榜</button>
    `;

        // Bind modal open event
        setTimeout(() => {
            const showBtn = document.getElementById('show-leaderboard-btn-arrow');
            if (showBtn) {
                showBtn.onclick = () => this.showLeaderboardModal(this.score);
            }
        }, 0);
    }

    showLeaderboardModal(score) {
        // Create modal if not exists
        let modal = document.getElementById('leaderboard-submit-modal-arrow');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'leaderboard-submit-modal-arrow';
            modal.className = 'modal';
            modal.innerHTML = `
        <div class="modal-content card">
          <div class="modal-header">
            <h2>🏆 提交成績</h2>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 1.2rem; text-align: center; margin-bottom: 1rem;">
              你的分數: <strong style="color: var(--primary);">${score}</strong>
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 1rem;">
              <input type="text" id="player-name-modal-arrow" placeholder="輸入名字" maxlength="15" 
                style="border: 3px solid #000; padding: 8px; font-family: inherit; font-weight: bold; flex: 1; max-width: 200px;">
              <button id="submit-score-btn-modal-arrow" class="btn btn-primary">提交</button>
            </div>
            <div id="submit-status-modal-arrow" style="text-align: center; margin-bottom: 1rem;"></div>
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">當前排行榜</h3>
            <div id="leaderboard-display-modal-arrow" style="max-height: 300px; overflow-y: auto;"></div>
          </div>
        </div>
      `;
            document.body.appendChild(modal);

            // Close modal handlers
            const closeBtn = modal.querySelector('.close-modal');
            closeBtn.onclick = () => modal.classList.remove('show');
            modal.onclick = (e) => {
                if (e.target === modal) modal.classList.remove('show');
            };
        }

        // Update score in modal
        const scoreDisplay = modal.querySelector('.modal-body p strong');
        if (scoreDisplay) scoreDisplay.textContent = score;

        // Show modal
        modal.classList.add('show');

        // Load leaderboard
        const loadLeaderboard = async () => {
            const display = document.getElementById('leaderboard-display-modal-arrow');
            display.innerHTML = '<p style="text-align: center;">載入中...</p>';
            const scores = await leaderboard.getScores('arrow-rush');
            if (scores && scores.length > 0) {
                let html = '<table style="width:100%; border-collapse: collapse;">';
                html += '<thead><tr style="border-bottom: 3px solid #000;"><th style="padding: 8px; text-align:left">排名</th><th style="padding: 8px; text-align:left">名字</th><th style="padding: 8px; text-align:right">分數</th></tr></thead><tbody>';
                scores.forEach((s, i) => {
                    const rank = i + 1;
                    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                    html += `<tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;"><strong>${medal} ${rank}</strong></td>
                    <td style="padding: 8px;">${s.name}</td>
                    <td style="padding: 8px; text-align:right; font-weight: bold; color: var(--primary);">${s.score}</td>
                </tr>`;
                });
                html += '</tbody></table>';
                display.innerHTML = html;
            } else {
                display.innerHTML = '<p style="text-align: center; color: #666;">尚無紀錄或無法連接</p>';
            }
        };

        loadLeaderboard();

        // Bind submit button
        const btn = document.getElementById('submit-score-btn-modal-arrow');
        const input = document.getElementById('player-name-modal-arrow');
        const status = document.getElementById('submit-status-modal-arrow');

        // Reset input
        input.value = '';
        input.disabled = false;
        btn.disabled = false;
        btn.textContent = '提交';
        status.innerHTML = '';

        btn.onclick = async () => {
            const name = input.value.trim();
            if (!name) {
                alert('請輸入名字');
                return;
            }
            btn.disabled = true;
            btn.textContent = '提交中...';

            const res = await leaderboard.submitScore('arrow-rush', name, score);
            if (res.success) {
                status.innerHTML = '<span style="color:green; font-weight:bold;">✅ 已提交！</span>';
                loadLeaderboard();
                input.disabled = true;
                btn.style.display = 'none';
            } else {
                status.innerHTML = '<span style="color:red; font-weight:bold;">❌ 提交失敗</span><br><small>' + (res.error || '') + '</small>';
                btn.disabled = false;
                btn.textContent = '重試';
            }
        };
    }

    resetGame() {
        // Remove playing class
        this.canvas.classList.remove('playing');

        this.restartBtn.classList.add('hidden');
        this.result.classList.add('hidden');

        // Reset UI values
        this.scoreEl.textContent = '0';
        this.comboEl.textContent = '0';
        this.timeEl.textContent = '30s';
        this.comboMultiplierEl.classList.add('hidden');

        // Clear canvas
        this.drawInitialScreen();
    }

    updateUI() {
        this.scoreEl.textContent = this.score;
        this.timeEl.textContent = `${this.timeLeft}s`;
        this.comboEl.textContent = this.combo;

        // Multiplier UI
        // Show only if multiplier > 1.0 (starts at combo 6)
        if (this.combo > 5) {
            this.comboMultiplierEl.classList.remove('hidden');
            const multiplier = (1 + Math.max(0, Math.floor((this.combo - 1) / 5)) * 0.1).toFixed(1);
            this.comboMultiplierEl.textContent = `x${multiplier}`;
        } else {
            this.comboMultiplierEl.classList.add('hidden');
        }
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


}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ArrowRushGame();
});
