/**
 * Block Lights Game - JavaScript Logic
 */

class BlockLightsGame {
    constructor() {
        // DOM elements
        this.gridContainer = document.getElementById('grid-container');
        this.scoreDisplay = document.getElementById('score');
        this.timeDisplay = document.getElementById('time');
        this.comboDisplay = document.getElementById('combo');
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

        // Rules modal
        this.rulesModal = document.getElementById('rules-modal');
        this.btnRules = document.getElementById('btn-rules');
        this.closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');

        // Game state
        this.isPlaying = false;
        this.isCountingDown = false;
        this.score = 0;
        this.combo = 0;
        this.sessionMaxCombo = 0; // Initialize session max combo
        this.timeLeft = 30;
        this.totalHits = 0;
        this.totalAttempts = 0;
        this.isEnding = false;

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

        // Event listeners for grid
        this.gridContainer.addEventListener('mousedown', (e) => {
            if (!this.isPlaying && !this.isCountingDown && !this.isEnding) {
                this.startGame();
            }
        });

        this.gridContainer.addEventListener('mouseleave', () => {
            this.gridContainer.classList.remove('active');
        });
        this.restartBtn.addEventListener('click', () => this.resetGame());

        // Modal listeners
        if (this.btnRules) {
            this.btnRules.addEventListener('click', () => this.openRules());
        }
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
        this.updateBalanceDisplay();
    }

    createGrid() {
        this.gridContainer.innerHTML = '';
        this.blocks = [];

        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const block = document.createElement('div');
            block.className = 'grid-block';
            block.dataset.index = i;
            block.addEventListener('mousedown', () => this.handleBlockClick(i));
            this.gridContainer.appendChild(block);
            this.blocks.push(block);
        }
    }

    openRules() {
        if (this.rulesModal) {
            this.rulesModal.classList.add('show');
        }
    }

    closeRules() {
        if (this.rulesModal) {
            this.rulesModal.classList.remove('show');
        }
    }

    startGame() {
        this.gridContainer.classList.remove('start-screen');
        if (this.result) this.result.classList.add('hidden');
        if (this.restartBtn) this.restartBtn.classList.add('hidden');
        this.showCountdown();
    }

    showCountdown() {
        let countdown = 3;
        this.isCountingDown = true;
        this.clearAllLights();

        const centerBlock = this.blocks[4];
        if (centerBlock) {
            centerBlock.textContent = countdown;
            centerBlock.style.fontSize = '3.5rem';
            centerBlock.style.fontWeight = '900';
            centerBlock.style.color = 'var(--primary)';
        }

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                if (centerBlock) centerBlock.textContent = countdown;
            } else {
                clearInterval(countdownInterval);
                if (centerBlock) {
                    centerBlock.textContent = '';
                    centerBlock.style.fontSize = '';
                    centerBlock.style.fontWeight = '';
                }
                this.isCountingDown = false;
                this.startGamePlay();
            }
        }, 1000);
    }

    startGamePlay() {
        this.isPlaying = true;
        this.score = 0;
        this.combo = 0;
        this.sessionMaxCombo = 0; // Reset session max combo
        this.timeLeft = 30;
        this.totalHits = 0;
        this.totalAttempts = 0;

        this.updateUI();
        this.lightRandomBlocks();
        this.startTimer();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            if (this.timeDisplay) this.timeDisplay.textContent = `${this.timeLeft}s`;
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    lightRandomBlocks() {
        const availableIndices = [];
        for (let i = 0; i < 9; i++) {
            if (!this.litBlocks.has(i)) availableIndices.push(i);
        }

        const blocksToLight = 3 - this.litBlocks.size;
        for (let i = 0; i < blocksToLight && availableIndices.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableIndices.length);
            const blockIndex = availableIndices.splice(randomIndex, 1)[0];
            this.litBlocks.add(blockIndex);
            if (this.blocks[blockIndex]) {
                this.blocks[blockIndex].classList.add('lit');
            }
        }
    }

    clearAllLights() {
        this.litBlocks.clear();
        this.blocks.forEach(block => {
            block.classList.remove('lit', 'correct', 'wrong');
            block.textContent = '';
        });
    }

    handleBlockClick(index) {
        if (!this.isPlaying) return;
        this.totalAttempts++;

        if (this.litBlocks.has(index)) {
            this.handleCorrectClick(index);
        } else {
            this.handleWrongClick(index);
        }
    }

    handleCorrectClick(index) {
        this.combo++;
        if (this.combo > this.sessionMaxCombo) {
            this.sessionMaxCombo = this.combo;
        }
        const multiplier = 1 + Math.max(0, Math.floor((this.combo - 1) / 5)) * 0.1;
        const points = Math.floor(50 * multiplier);
        this.score += points;
        this.totalHits++;

        // Multiplier Animation
        if ((this.combo - 1) % 5 === 0 && this.combo > 1) {
            if (this.comboMultiplierEl) {
                this.comboMultiplierEl.classList.remove('shake');
                void this.comboMultiplierEl.offsetWidth;
                this.comboMultiplierEl.classList.add('shake');
            }
        }

        // this.showFloatingText(index, `${points}`);

        if (this.blocks[index]) {
            this.blocks[index].classList.remove('lit');
            this.blocks[index].classList.add('correct');
            setTimeout(() => {
                if (this.blocks[index]) this.blocks[index].classList.remove('correct');
            }, 200);
        }

        this.litBlocks.delete(index);
        setTimeout(() => {
            if (this.isPlaying) this.lightRandomBlocks();
        }, 50);

        this.updateUI();
    }

    handleWrongClick(index) {
        this.score = Math.max(0, this.score - 50);
        this.combo = 0;
        if (this.blocks[index]) {
            this.blocks[index].classList.add('wrong');
            setTimeout(() => {
                if (this.blocks[index]) this.blocks[index].classList.remove('wrong');
            }, 200);
        }
        this.updateUI();
    }

    updateUI() {
        if (this.scoreDisplay) this.scoreDisplay.textContent = this.score;
        if (this.comboDisplay) this.comboDisplay.textContent = this.combo;

        if (this.comboMultiplierEl) {
            if (this.combo > 5) {
                this.comboMultiplierEl.classList.remove('hidden');
                const multiplierVal = (1 + Math.max(0, Math.floor((this.combo - 1) / 5)) * 0.1).toFixed(1);
                this.comboMultiplierEl.textContent = `x${multiplierVal}`;
            } else {
                this.comboMultiplierEl.classList.add('hidden');
            }
        }
    }

    showFloatingText(index, text) {
        const block = this.blocks[index];
        if (!block) return;
        const rect = block.getBoundingClientRect();
        const containerRect = this.gridContainer.getBoundingClientRect();

        const x = rect.left - containerRect.left + (rect.width / 2);
        const y = rect.top - containerRect.top + (rect.height / 2);

        const el = document.createElement('div');
        el.className = 'floating-text';
        el.textContent = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = 'translate(-50%, -50%)';

        this.gridContainer.appendChild(el);
        setTimeout(() => el.remove(), 600);
    }

    endGame() {
        this.isPlaying = false;
        this.isEnding = true;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.clearAllLights();

        this.stats.totalPlays++;
        if (this.score > this.stats.highScore) this.stats.highScore = this.score;
        if (this.combo > this.stats.maxCombo) this.stats.maxCombo = this.combo;
        this.stats.totalHits += this.totalHits;
        this.stats.totalAttempts += this.totalAttempts;
        this.saveStats();
        this.rankScoresPromise = leaderboard.getScores('block-lights');
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
            if (this.restartBtn) this.restartBtn.classList.remove('hidden');
            this.showRankPreviewThenModal(this.score);
        }, 1500);
    }

    showLeaderboardModal(score) {
        // Calculate stats
        const accuracy = this.totalAttempts > 0 ? Math.round((this.totalHits / this.totalAttempts) * 100) : 0;
        const blockCount = this.totalHits;
        const maxCombo = this.sessionMaxCombo; // Use session max combo

        let modal = document.getElementById('leaderboard-submit-modal-blocks');
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
                </div>`;
        };

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'leaderboard-submit-modal-blocks';
            buildModalContent();
            document.body.appendChild(modal);
        } else if (!modal.querySelector('.leaderboard-tabs')) {
            buildModalContent();
        }

        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) closeBtn.onclick = () => modal.classList.remove('show');
        modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };

        const scoreStrong = modal.querySelector('.modal-body p strong');
        if (scoreStrong) scoreStrong.textContent = score;
        modal.classList.add('show');

        const display = document.getElementById('leaderboard-display-modal-blocks');
        const currentGameId = 'block-lights';
        const showLeaderboardForGame = async () => {
            return await this.loadLeaderboardData(currentGameId, display);
        };
        showLeaderboardForGame();

        const btn = document.getElementById('submit-score-btn-modal-blocks');
        const input = document.getElementById('player-name-modal-blocks');
        const status = document.getElementById('submit-status-modal-blocks');
        if (input) { input.value = ''; input.disabled = false; }
        if (btn) { btn.disabled = false; btn.style.display = 'block'; btn.textContent = '提交'; }
        if (status) status.innerHTML = '';

        if (btn) {
            btn.onclick = async () => {
                const name = input ? input.value.trim() : '';
                if (!name) return alert('請輸入名字');
                btn.disabled = true; btn.textContent = '提交中...';

                // Submit with details
                const details = {
                    count: blockCount,
                    accuracy: accuracy + '%',
                    maxCombo: maxCombo
                };

                const res = await leaderboard.submitScore('block-lights', name, score, details);
                if (res.success) {
                    if (status) status.innerHTML = '<span style="color:green; font-weight:bold;">✅ 已提交！</span>';
                    this.clearLeaderboardCache(currentGameId);
                    const scores = await showLeaderboardForGame();
                    const rank = this.getRankFromResponse(res) ?? this.findLeaderboardRank(scores, name, score);
                    this.applyLeaderboardReward(rank);
                    if (input) input.disabled = true;
                    btn.style.display = 'none';
                } else {
                    if (status) status.innerHTML = '<span style="color:red;">❌ 失敗</span>';
                    btn.disabled = false; btn.textContent = '重試';
                }
            };
        }

        const playAgainBtn = document.getElementById('play-again-btn-blocks');
        if (playAgainBtn) {
            playAgainBtn.onclick = () => {
                modal.classList.remove('show');
                this.resetGame();
            };
        }
    }

    resetGame() {
        this.isPlaying = false;
        this.isCountingDown = false;
        this.isEnding = false;
        if (this.result) this.result.classList.add('hidden');
        if (this.restartBtn) this.restartBtn.classList.add('hidden');
        this.score = 0;
        this.combo = 0;
        this.sessionMaxCombo = 0; // Reset session max combo
        this.timeLeft = 30;
        this.totalHits = 0;
        this.totalAttempts = 0;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.updateUI();
        if (this.timeDisplay) this.timeDisplay.textContent = '30s';
        this.clearAllLights();
        this.gridContainer.classList.add('start-screen');
    }

    loadStats() {
        const saved = localStorage.getItem('blockLightsStats');
        return saved ? JSON.parse(saved) : { totalPlays: 0, highScore: 0, maxCombo: 0, totalHits: 0, totalAttempts: 0 };
    }

    saveStats() {
        localStorage.setItem('blockLightsStats', JSON.stringify(this.stats));
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
            const scores = await this.getPrefetchedScores('block-lights');
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

document.addEventListener('DOMContentLoaded', () => { new BlockLightsGame(); });
