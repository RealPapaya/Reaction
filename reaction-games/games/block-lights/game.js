class BlockLightsGame {
    constructor() {
        // DOM elements
        this.gridContainer = document.getElementById('grid-container');
        this.scoreDisplay = document.getElementById('score');
        this.timeDisplay = document.getElementById('time');
        this.comboDisplay = document.getElementById('combo');
        this.restartBtn = document.getElementById('restart-btn');
        this.result = document.getElementById('result');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');

        // Rules modal
        this.rulesModal = document.getElementById('rules-modal');
        this.btnRules = document.getElementById('btn-rules');
        this.closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');

        // Game state
        this.isPlaying = false;
        this.isCountingDown = false;
        this.score = 0;
        this.combo = 0;
        this.timeLeft = 30;
        this.totalHits = 0;
        this.totalAttempts = 0;

        // Grid
        this.gridSize = 3;
        this.blocks = [];
        this.litBlocks = new Set(); // Indices of lit blocks

        // Timer
        this.timerInterval = null;

        // Stats from localStorage
        this.stats = this.loadStats();

        // Initialize
        this.init();
    }

    init() {
        // Create grid
        this.createGrid();

        // Add start-screen class initially
        this.gridContainer.classList.add('start-screen');

        // Event listeners for grid (like canvas in arrow-rush)
        this.gridContainer.addEventListener('mousedown', () => {
            if (!this.isPlaying && !this.isCountingDown) {
                this.gridContainer.classList.add('active');
            }
        });

        this.gridContainer.addEventListener('mouseup', () => {
            const wasActive = this.gridContainer.classList.contains('active');
            this.gridContainer.classList.remove('active');

            // Start game on mouseup if grid was pressed
            if (wasActive && !this.isPlaying && !this.isCountingDown) {
                this.startGame();
            }
        });

        this.gridContainer.addEventListener('mouseleave', () => {
            this.gridContainer.classList.remove('active');
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

        // Show rules on load
        this.openRules();
    }

    createGrid() {
        this.gridContainer.innerHTML = '';
        this.blocks = [];

        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const block = document.createElement('div');
            block.className = 'grid-block';
            block.dataset.index = i;

            block.addEventListener('click', () => this.handleBlockClick(i));

            this.gridContainer.appendChild(block);
            this.blocks.push(block);
        }
    }

    openRules() {
        this.rulesModal.classList.add('show');
    }

    closeRules() {
        this.rulesModal.classList.remove('show');
    }

    startGame() {
        // Remove start-screen class
        this.gridContainer.classList.remove('start-screen');

        // Hide buttons
        this.result.classList.add('hidden');
        this.restartBtn.classList.add('hidden');

        // Show countdown
        this.showCountdown();
    }

    showCountdown() {
        let countdown = 3;
        this.isCountingDown = true;

        // Clear grid and show countdown
        this.clearAllLights();
        const centerBlock = this.blocks[4]; // Center block
        centerBlock.textContent = countdown;
        centerBlock.style.fontSize = 'var(--text-4xl)';
        centerBlock.style.color = 'var(--primary)';

        countdown--;

        const countdownInterval = setInterval(() => {
            if (countdown > 0) {
                centerBlock.textContent = countdown;
                countdown--;
            } else {
                clearInterval(countdownInterval);
                centerBlock.textContent = '';
                centerBlock.style.fontSize = '';
                centerBlock.style.color = '';
                this.isCountingDown = false;
                this.startGamePlay();
            }
        }, 1000);
    }

    startGamePlay() {
        // Reset state
        this.isPlaying = true;
        this.score = 0;
        this.combo = 0;
        this.timeLeft = 30;
        this.totalHits = 0;
        this.totalAttempts = 0;

        // Update UI
        this.updateUI();

        // Light up initial blocks
        this.lightRandomBlocks();

        // Start timer
        this.startTimer();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.timeDisplay.textContent = `${this.timeLeft}s`;

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    lightRandomBlocks() {
        // Light up 2 random blocks (keeping existing lit blocks)
        const availableIndices = [];
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            if (!this.litBlocks.has(i)) {
                availableIndices.push(i);
            }
        }

        // Calculate how many more blocks we need to light
        const blocksToLight = 2 - this.litBlocks.size;

        for (let i = 0; i < blocksToLight && availableIndices.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            const blockIndex = availableIndices.splice(randomIndex, 1)[0];

            this.litBlocks.add(blockIndex);
            this.blocks[blockIndex].classList.add('lit');
        }
    }

    clearAllLights() {
        this.litBlocks.clear();
        this.blocks.forEach(block => {
            block.classList.remove('lit', 'correct', 'wrong');
        });
    }

    handleBlockClick(index) {
        if (!this.isPlaying) return;

        this.totalAttempts++;

        if (this.litBlocks.has(index)) {
            // Correct click
            this.handleCorrectClick(index);
        } else {
            // Wrong click
            this.handleWrongClick(index);
        }
    }

    handleCorrectClick(index) {
        // Update score and combo
        this.score += 10;
        this.combo++;
        this.totalHits++;

        // Visual feedback
        this.blocks[index].classList.remove('lit');
        this.blocks[index].classList.add('correct');
        setTimeout(() => {
            this.blocks[index].classList.remove('correct');
        }, 300);

        // Remove from lit blocks
        this.litBlocks.delete(index);

        // Immediately light a new block to keep 2 lit
        setTimeout(() => {
            this.lightRandomBlocks();
        }, 100);

        // Update UI
        this.updateUI();
    }

    handleWrongClick(index) {
        // Update score and combo
        this.score = Math.max(0, this.score - 5);
        this.combo = 0;

        // Visual feedback
        this.blocks[index].classList.add('wrong');
        setTimeout(() => {
            this.blocks[index].classList.remove('wrong');
        }, 300);

        // Update UI
        this.updateUI();
    }

    updateUI() {
        this.scoreDisplay.textContent = this.score;
        this.comboDisplay.textContent = this.combo;
    }

    endGame() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);

        // Clear all lights
        this.clearAllLights();

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
        // Directly show leaderboard modal
        this.showLeaderboardModal(this.score);
    }

    showLeaderboardModal(score) {
        // Create modal if not exists
        let modal = document.getElementById('leaderboard-submit-modal-blocks');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'leaderboard-submit-modal-blocks';
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
              <input type="text" id="player-name-modal-blocks" placeholder="輸入名字" maxlength="15" 
                style="border: 3px solid #000; padding: 8px; font-family: inherit; font-weight: bold; flex: 1; max-width: 200px;">
              <button id="submit-score-btn-modal-blocks" class="btn btn-primary">提交</button>
            </div>
            <div id="submit-status-modal-blocks" style="text-align: center; margin-bottom: 1rem;"></div>
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">當前排行榜</h3>
            <div id="leaderboard-display-modal-blocks" style="max-height: 300px; overflow-y: auto;"></div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 2rem; padding-top: 1rem; border-top: 3px solid var(--border-color);">
              <a href="../../index.html" class="btn btn-secondary">← 返回首頁</a>
              <button id="play-again-btn-blocks" class="btn btn-primary">再玩一次 🎮</button>
            </div>
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
            const display = document.getElementById('leaderboard-display-modal-blocks');
            display.innerHTML = '<p style="text-align: center;">載入中...</p>';
            const scores = await leaderboard.getScores('block-lights');
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
        const btn = document.getElementById('submit-score-btn-modal-blocks');
        const input = document.getElementById('player-name-modal-blocks');
        const status = document.getElementById('submit-status-modal-blocks');

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

            const res = await leaderboard.submitScore('block-lights', name, score);
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

        // Bind play again button
        const playAgainBtn = document.getElementById('play-again-btn-blocks');
        if (playAgainBtn) {
            playAgainBtn.onclick = () => {
                modal.classList.remove('show');
                this.resetGame();
            };
        }
    }

    resetGame() {
        // Show start section, hide game section
        this.startSection.classList.remove('hidden');
        this.gameSection.classList.add('hidden');

        // Reset UI
        this.result.classList.add('hidden');
        this.restartBtn.classList.add('hidden');

        // Reset game state
        this.isPlaying = false;
        this.isCountingDown = false;
        this.score = 0;
        this.combo = 0;
        this.timeLeft = 30;
        this.totalHits = 0;
        this.totalAttempts = 0;

        // Clear timer
        clearInterval(this.timerInterval);

        // Reset UI
        this.updateUI();
        this.timeDisplay.textContent = '30s';

        // Clear grid
        this.clearAllLights();
    }

    loadStats() {
        const saved = localStorage.getItem('blockLightsStats');
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
        localStorage.setItem('blockLightsStats', JSON.stringify(this.stats));
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlockLightsGame();
});
