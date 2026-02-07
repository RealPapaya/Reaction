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

        // Coin display
        this.coinBalanceEl = document.getElementById('coin-balance');
        this.coinDeltaEl = document.getElementById('coin-delta');
        this.deltaTimeout = null;
        this.balance = this.loadBalance();
        this.rewardToast = null;
        this.rewardToastTimeout = null;
        this.rankToast = null;
        this.rankToastTimeout = null;
        this.rankScoresPromise = null;
        this.leaderboardCache = {};
        this.leaderboardLoading = {};

        // Modal elements
        this.rulesModal = document.getElementById('rules-modal');
        this.btnRules = document.getElementById('btn-rules');
        this.closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');

        // Game state
        this.isPlaying = false;
        this.isPaused = false;
        this.isFrozen = false;
        this.isCountingDown = false;
        this.score = 0;
        this.combo = 0;
        this.timeLeft = 30;
        this.arrowQueue = []; // Queue of arrows
        this.totalHits = 0;
        this.totalAttempts = 0;
        this.floatingTexts = []; // Floating score texts
        this.isEnding = false;

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
        this.animationId = null;

        // Stats from localStorage
        this.stats = this.loadStats();

        // Initialize
        this.init();
    }

    init() {
        // Event listeners - removed click, using mouseup instead for better button feel

        // Add button-like feedback for canvas
        this.canvas.addEventListener('mousedown', () => {
            if (!this.isPlaying) {
                this.canvas.classList.add('active');
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            const wasActive = this.canvas.classList.contains('active');
            this.canvas.classList.remove('active');

            // Start game on mouseup if button was pressed (and not already counting down)
            if (wasActive && !this.isPlaying && !this.isCountingDown && !this.isEnding) {
                this.startGame();
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.canvas.classList.remove('active');
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
        this.updateBalanceDisplay();
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
        this.isCountingDown = true; // Prevent re-triggering countdown

        // Draw first number immediately (no delay)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#F97316';
        this.ctx.font = 'bold 120px Fredoka, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(countdown, this.canvas.width / 2, this.canvas.height / 2);

        countdown--;

        const countdownInterval = setInterval(() => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (countdown > 0) {
                // Draw countdown number
                this.ctx.fillStyle = '#F97316';
                this.ctx.font = 'bold 120px Fredoka, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(countdown, this.canvas.width / 2, this.canvas.height / 2);
                countdown--;
            } else {
                clearInterval(countdownInterval);
                this.isCountingDown = false;
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
        this.sessionMaxCombo = 0;
        this.timeLeft = 30;
        this.totalHits = 0;
        this.totalAttempts = 0;

        // Update UI
        this.updateUI();

        // Generate initial arrows
        this.arrowQueue = [];
        this.floatingTexts = []; // Clear floating texts
        for (let i = 0; i < 6; i++) {
            this.arrowQueue.push(this.getRandomDirection());
        }

        // Start timer
        this.startTimer();

        // Start animation loop
        this.startAnimationLoop();

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
        if (this.combo > this.sessionMaxCombo) {
            this.sessionMaxCombo = this.combo;
        }

        // Calculate Multiplier
        // 0-5: x1.0
        // 6-10: x1.1
        // 11-15: x1.2
        // Formula: 1 + max(0, floor((combo - 1) / 5)) * 0.1
        const multiplier = 1 + Math.max(0, Math.floor((this.combo - 1) / 5)) * 0.1;

        // Points calculation
        const points = Math.floor(87 * multiplier);

        this.score += points;
        this.totalHits++;

        // Visual feedback - hit success animation
        this.canvas.classList.add('hit-success');
        setTimeout(() => {
            this.canvas.classList.remove('hit-success');
        }, 200);

        // Add floating score text
        const targetY = this.canvas.height - 150;
        this.floatingTexts.push({
            text: `+${points}`,
            x: this.canvas.width / 2 + 100, // Right side of arrow
            y: targetY,
            createdAt: Date.now()
        });

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

        // Draw and update floating texts
        const now = Date.now();
        this.floatingTexts = this.floatingTexts.filter(ft => {
            const elapsed = (now - ft.createdAt) / 1000; // seconds

            // Remove after 1 second
            if (elapsed > 1.0) return false;

            // Update position
            ft.y -= 0.8; // Float upward slowly

            // Draw text (always full opacity)
            this.ctx.save();
            this.ctx.fillStyle = '#22C55E'; // Success green
            this.ctx.font = 'bold 32px Fredoka, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Add stroke for better visibility
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(ft.text, ft.x, ft.y);
            this.ctx.fillText(ft.text, ft.x, ft.y);
            this.ctx.restore();

            return true;
        });
    }

    startAnimationLoop() {
        const animate = () => {
            if (this.isPlaying) {
                this.render();
                this.animationId = requestAnimationFrame(animate);
            }
        };
        animate();
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
        this.isEnding = true;
        clearInterval(this.timerInterval);
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

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
        this.rankScoresPromise = leaderboard.getScores('arrow-rush');
        this.awardCoins(50);

        this.showResult();
    }

    showResult() {
        // Create Time's Up overlay
        const overlay = document.createElement('div');
        overlay.className = 'times-up-overlay';
        overlay.innerHTML = '<div class="times-up-text">時間到</div><div class="times-up-reward">完成遊戲 +50金幣</div>';
        document.body.appendChild(overlay);

        // Wait before showing leaderboard and allowing restart
        setTimeout(() => {
            overlay.remove();
            this.restartBtn.classList.remove('hidden');
            this.showRankPreviewThenModal(this.score);
        }, 1500);
    }

    showLeaderboardModal(score) {
        // Calculate stats
        const accuracy = this.totalAttempts > 0 ? Math.round((this.totalHits / this.totalAttempts) * 100) : 0;
        const arrowCount = this.totalHits;
        const maxCombo = this.sessionMaxCombo; // Use session max combo

        // Create modal if not exists
        let modal = document.getElementById('leaderboard-submit-modal-arrow');
        const buildModalContent = () => {
            modal.className = 'modal';
            modal.innerHTML = `
        <div class="modal-content card">
          <div class="modal-header">
            <h2>🏆 遊戲結束</h2>
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
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 2rem; padding-top: 1rem; border-top: 3px solid var(--border-color);">
              <a href="../../index.html" class="btn btn-secondary">← 返回首頁</a>
              <button id="play-again-btn-arrow" class="btn btn-primary">再玩一次 🎮</button>
            </div>
          </div>
        </div>
      `;
        };

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'leaderboard-submit-modal-arrow';
            buildModalContent();
            document.body.appendChild(modal);
        } else if (!modal.querySelector('.leaderboard-tabs')) {
            buildModalContent();
        }

        // Close modal handlers
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) closeBtn.onclick = () => modal.classList.remove('show');
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('show');
        };

        // Update score in modal
        const scoreDisplay = modal.querySelector('.modal-body p strong');
        if (scoreDisplay) scoreDisplay.textContent = score;

        // Show modal
        modal.classList.add('show');

        const display = document.getElementById('leaderboard-display-modal-arrow');
        const currentGameId = 'arrow-rush';
        const showLeaderboardForGame = async () => {
            return await this.loadLeaderboardData(currentGameId, display);
        };
        showLeaderboardForGame();

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

            // Submit with details
            const details = {
                count: arrowCount,
                accuracy: accuracy + '%',
                maxCombo: maxCombo
            };

            const res = await leaderboard.submitScore('arrow-rush', name, score, details);
            if (res.success) {
                status.innerHTML = '<span style="color:green; font-weight:bold;">✅ 已提交！</span>';
                this.clearLeaderboardCache(currentGameId);
                const scores = await showLeaderboardForGame();
                const rank = this.getRankFromResponse(res) ?? this.findLeaderboardRank(scores, name, score);
                this.applyLeaderboardReward(rank);
                input.disabled = true;
                btn.style.display = 'none';
            } else {
                status.innerHTML = '<span style="color:red; font-weight:bold;">❌ 提交失敗</span><br><small>' + (res.error || '') + '</small>';
                btn.disabled = false;
                btn.textContent = '重試';
            }
        };

        // Bind play again button
        const playAgainBtn = document.getElementById('play-again-btn-arrow');
        if (playAgainBtn) {
            playAgainBtn.onclick = () => {
                modal.classList.remove('show');
                this.resetGame();
            };
        }
    }

    resetGame() {
        // Remove playing class
        this.canvas.classList.remove('playing');
        this.isEnding = false;

        this.restartBtn.classList.add('hidden');
        this.result.classList.add('hidden');

        // Reset UI values
        this.scoreEl.textContent = '0';
        this.comboEl.textContent = '0';
        this.sessionMaxCombo = 0; // Reset session max combo
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

    loadBalance() {
        const saved = localStorage.getItem('playerBalance');
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed)) return parsed;
        return 10000;
    }

    saveBalance() {
        localStorage.setItem('playerBalance', this.balance);
    }

    updateBalanceDisplay() {
        if (this.coinBalanceEl) {
            this.coinBalanceEl.textContent = this.balance.toLocaleString();
        }
    }

    showBalanceDelta(delta) {
        if (!this.coinDeltaEl || !delta) return;
        const sign = delta > 0 ? '+' : '';
        this.coinDeltaEl.textContent = `${sign}${delta.toLocaleString()}`;
        this.coinDeltaEl.classList.remove('positive', 'negative', 'show');
        this.coinDeltaEl.classList.add(delta > 0 ? 'positive' : 'negative');

        void this.coinDeltaEl.offsetWidth;
        this.coinDeltaEl.classList.add('show');

        if (this.deltaTimeout) {
            clearTimeout(this.deltaTimeout);
        }
        this.deltaTimeout = setTimeout(() => {
            this.coinDeltaEl.classList.remove('show');
        }, 1200);
    }

    awardCoins(amount) {
        if (!amount) return;
        this.balance += amount;
        this.saveBalance();
        this.updateBalanceDisplay();
        this.showBalanceDelta(amount);
    }

    showRewardToast(message) {
        if (!message) return;
        if (!this.rewardToast) {
            this.rewardToast = document.createElement('div');
            this.rewardToast.className = 'reward-toast';
            document.body.appendChild(this.rewardToast);
        }
        this.rewardToast.textContent = message;
        this.rewardToast.classList.remove('show');
        void this.rewardToast.offsetWidth;
        this.rewardToast.classList.add('show');

        if (this.rewardToastTimeout) {
            clearTimeout(this.rewardToastTimeout);
        }
        this.rewardToastTimeout = setTimeout(() => {
            this.rewardToast.classList.remove('show');
        }, 1600);
    }

    showRankToast(message) {
        if (!message) return;
        if (!this.rankToast) {
            this.rankToast = document.createElement('div');
            this.rankToast.className = 'rank-refresh-toast';
            document.body.appendChild(this.rankToast);
        }
        this.rankToast.textContent = message;
        this.rankToast.classList.remove('show');
        void this.rankToast.offsetWidth;
        this.rankToast.classList.add('show');

        if (this.rankToastTimeout) {
            clearTimeout(this.rankToastTimeout);
        }
        this.rankToastTimeout = setTimeout(() => {
            this.rankToast.classList.remove('show');
        }, 2000);
    }

    getLeaderboardReward(rank) {
        if (rank === 1) return 1000;
        if (rank === 2) return 750;
        if (rank === 3) return 500;
        return 0;
    }

    applyLeaderboardReward(rank) {
        if (!rank) return;
        const reward = this.getLeaderboardReward(rank);
        if (reward > 0) {
            this.awardCoins(reward);
            this.showRewardToast(`排行榜獎勵 +${reward}金幣`);
        }
    }

    getRankFromResponse(res) {
        if (!res) return null;
        const rankValue = res.rank ?? res.position ?? (res.data && res.data.rank);
        const parsed = Number(rankValue);
        return Number.isNaN(parsed) ? null : parsed;
    }

    normalizeName(name) {
        return String(name || '').trim().toLowerCase();
    }

    getScoreNumber(value) {
        const direct = Number(value);
        if (!Number.isNaN(direct)) return direct;
        const cleaned = String(value || '').replace(/[^\d.-]/g, '');
        const parsed = Number(cleaned);
        return Number.isNaN(parsed) ? null : parsed;
    }

    findLeaderboardRank(scores, name, score) {
        if (!scores || scores.length === 0) return null;
        const targetName = this.normalizeName(name);
        if (!targetName) return null;
        const targetScore = this.getScoreNumber(score);

        const candidates = scores
            .map((s, idx) => ({
                idx,
                name: this.normalizeName(s.name),
                score: this.getScoreNumber(s.score)
            }))
            .filter((entry) => entry.name === targetName);

        if (candidates.length === 0) return null;
        if (targetScore === null) return candidates[0].idx + 1;

        let best = candidates[0];
        let bestDiff = best.score === null ? Number.POSITIVE_INFINITY : Math.abs(best.score - targetScore);

        for (let i = 1; i < candidates.length; i++) {
            const candidate = candidates[i];
            const diff = candidate.score === null ? Number.POSITIVE_INFINITY : Math.abs(candidate.score - targetScore);
            if (diff < bestDiff) {
                best = candidate;
                bestDiff = diff;
            }
        }

        return best.idx + 1;
    }

    clearLeaderboardCache(gameId) {
        if (gameId) {
            delete this.leaderboardCache[gameId];
            delete this.leaderboardLoading[gameId];
        } else {
            this.leaderboardCache = {};
            this.leaderboardLoading = {};
        }
    }

    renderLeaderboardTable(gameId, scores, display) {
        if (!display) return;
        if (!scores || scores.length === 0) {
            display.innerHTML = '<p style="text-align: center; color: #666;">尚無紀錄或無法連接</p>';
            return;
        }

        let html = '<table style="width:100%; border-collapse: collapse;">';

        if (gameId === 'reaction-test') {
            html += '<thead><tr style="border-bottom: 3px solid #000;"><th style="padding: 8px; text-align:left">排名</th><th style="padding: 8px; text-align:left">名字</th><th style="padding: 8px; text-align:right">時間</th></tr></thead><tbody>';
            scores.forEach((s, i) => {
                const rank = i + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                html += `<tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;"><strong>${medal} ${rank}</strong></td>
                    <td style="padding: 8px;">${s.name}</td>
                    <td style="padding: 8px; text-align:right; font-weight: bold; color: var(--primary);">${s.score}ms</td>
                </tr>`;
            });
        } else {
            const countLabel = gameId === 'arrow-rush' ? '箭頭' : '方塊';
            html += `<thead><tr style="border-bottom: 3px solid #000;"><th style="padding: 8px; text-align:left">排名</th><th style="padding: 8px; text-align:left">名字</th><th style="padding: 8px; text-align:right">${countLabel}</th><th style="padding: 8px; text-align:right">正確率</th><th style="padding: 8px; text-align:right">最高連擊</th><th style="padding: 8px; text-align:right">分數</th></tr></thead><tbody>`;
            scores.forEach((s, i) => {
                const rank = i + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                const details = s.details ? (typeof s.details === 'string' ? JSON.parse(s.details) : s.details) : {};
                html += `<tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;"><strong>${medal} ${rank}</strong></td>
                    <td style="padding: 8px;">${s.name}</td>
                    <td style="padding: 8px; text-align:right">${details.count || '-'}</td>
                    <td style="padding: 8px; text-align:right">${details.accuracy || '-'}</td>
                    <td style="padding: 8px; text-align:right">${details.maxCombo || '-'}</td>
                    <td style="padding: 8px; text-align:right; font-weight: bold; color: var(--primary);">${s.score}</td>
                </tr>`;
            });
        }

        html += '</tbody></table>';
        display.innerHTML = html;
    }

    async loadLeaderboardData(gameId, display) {
        if (!gameId) return [];
        if (this.leaderboardCache[gameId]) {
            this.renderLeaderboardTable(gameId, this.leaderboardCache[gameId], display);
            return this.leaderboardCache[gameId];
        }

        if (this.leaderboardLoading[gameId]) return [];
        this.leaderboardLoading[gameId] = true;
        if (display) display.innerHTML = '<p style="text-align: center;">載入中...</p>';

        try {
            const scores = await leaderboard.getScores(gameId);
            this.leaderboardCache[gameId] = scores || [];
            this.renderLeaderboardTable(gameId, this.leaderboardCache[gameId], display);
            return this.leaderboardCache[gameId];
        } catch (error) {
            this.renderLeaderboardTable(gameId, [], display);
            return [];
        } finally {
            this.leaderboardLoading[gameId] = false;
        }
    }

    getPreviewRank(scores, score, isLowerBetter) {
        if (!scores || scores.length === 0) return 1;
        const targetScore = this.getScoreNumber(score);
        if (targetScore === null) return null;
        const scoreNumbers = scores
            .map((s) => this.getScoreNumber(s.score))
            .filter((value) => value !== null);
        if (scoreNumbers.length === 0) return 1;

        const betterCount = scoreNumbers.filter((value) => {
            if (isLowerBetter) return value < targetScore;
            return value > targetScore;
        }).length;

        return betterCount + 1;
    }

    async getPrefetchedScores(gameId) {
        const promise = this.rankScoresPromise;
        this.rankScoresPromise = null;
        if (promise) {
            try {
                const scores = await promise;
                if (scores) {
                    this.leaderboardCache[gameId] = scores;
                }
                return scores;
            } catch (error) {
                return null;
            }
        }

        try {
            const scores = await leaderboard.getScores(gameId);
            if (scores) {
                this.leaderboardCache[gameId] = scores;
            }
            return scores;
        } catch (error) {
            return null;
        }
    }

    async showRankPreviewThenModal(score) {
        let rank = null;
        try {
            const scores = await this.getPrefetchedScores('arrow-rush');
            rank = this.getPreviewRank(scores, score, false);
        } catch (error) {
            rank = null;
        }

        const reward = this.getLeaderboardReward(rank);
        const hasReward = reward > 0;
        if (hasReward) {
            this.showRankToast(`刷新排行榜！第${rank}名！提交名字可再獲得${reward}金幣！`);
        }

        setTimeout(() => {
            this.showLeaderboardModal(score);
        }, hasReward ? 2200 : 200);
    }


}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ArrowRushGame();
});
