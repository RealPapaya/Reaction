/**
 * Reaction Test Game - JavaScript Logic
 * Red Light, Green Light reaction time tester
 */

class ReactionGame {
  constructor() {
    // DOM Elements
    this.gameButton = document.getElementById('game-button');
    this.gameText = document.getElementById('game-text');
    this.resetBtn = document.getElementById('reset-btn');
    this.result = document.getElementById('result');
    this.resultTitle = document.getElementById('result-title');
    this.resultMessage = document.getElementById('result-message');
    this.historyList = document.getElementById('history-list');

    // Chart elements
    this.chartCanvas = document.getElementById('chart-canvas');
    this.chartCtx = this.chartCanvas ? this.chartCanvas.getContext('2d') : null;

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
    this.isWaiting = false;
    this.isGreen = false;
    this.gameStarted = false;
    this.startTime = null;
    this.timeout = null;
    this.currentRound = 0;
    this.roundTimes = [];
    this.TOTAL_ROUNDS = 5;

    // Stats from localStorage
    this.stats = this.loadStats();

    // Initialize
    this.init();
  }

  init() {
    // Event listeners
    this.gameButton.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!this.gameStarted) {
        // Game not started, start it
        this.startGame();
      } else if (this.isWaiting || this.isGreen) {
        // Game in progress, handle input
        this.handleInput();
      }
    });
    this.resetBtn.addEventListener('click', () => this.resetGame());


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
    this.updateBalanceDisplay();
  }

  openRules() {
    this.rulesModal.classList.add('show');
    // For reaction game, no timer to pause usually, unless we are mid-waiting
    if (this.isWaiting) {
      // Maybe cancel current round? Or just let it run in bg.
      // Let's reset if waiting to avoid cheap shots?
      // Actually simplest is just visual overlay.
    }
  }

  closeRules() {
    this.rulesModal.classList.remove('show');
  }

  startGame() {
    // Hide buttons
    this.result.classList.add('hidden');
    this.resetBtn.classList.add('hidden');

    // Reset state
    this.gameStarted = true;
    this.isWaiting = true;
    this.isGreen = false;
    this.currentRound = 1;
    this.roundTimes = [];
    this.updateHistoryUI(); // Clear list

    this.startRound();
  }

  startRound() {
    // Reset light state for new round
    this.isWaiting = true;
    this.isGreen = false;

    // Show red light
    this.gameButton.className = 'game-button red';
    this.gameText.textContent = `Round ${this.currentRound} / ${this.TOTAL_ROUNDS}\n等待綠燈...`;

    // Random delay between 2-5 seconds
    const delay = Math.random() * 3000 + 2000; // 2000-5000ms

    this.timeout = setTimeout(() => {
      this.showGreenLight();
    }, delay);
  }

  showGreenLight() {
    this.isGreen = true;
    this.isWaiting = false;
    this.startTime = Date.now();

    this.gameButton.className = 'game-button green clickable';
    this.gameText.textContent = '點擊！';
  }

  handleInput() {
    // Only process if game is in progress (waiting for green or green is showing)
    if (!this.isWaiting && !this.isGreen) {
      // Game hasn't started yet - this shouldn't happen with new logic
      return;
    }

    if (this.isWaiting) {
      // Too early! Still red
      this.handleEarlyClick();
    } else if (this.isGreen) {
      // Success! Calculate reaction time
      this.handleSuccessClick();
    }
  }

  handleEarlyClick() {
    // Clear timeout
    clearTimeout(this.timeout);

    // Update state
    this.isWaiting = false;
    this.isGreen = false;
    this.gameStarted = false; // End game

    // Visual feedback
    this.gameButton.className = 'game-button early-click';
    this.gameText.textContent = '太早了！';

    // Show result
    this.showResult(false, '失敗！你在紅燈時就點擊了。');

    // Update stats (failed attempt)
    this.stats.totalPlays++;
    this.stats.failures++;
    this.saveStats();
  }

  handleSuccessClick() {
    // Calculate reaction time
    const reactionTime = Date.now() - this.startTime;

    // Update state
    this.isGreen = false;
    this.roundTimes.push(reactionTime);

    // Visual feedback
    this.gameButton.className = 'game-button success-click';
    this.gameText.textContent = `${reactionTime}ms`;

    // Update History UI
    this.updateHistoryUI();

    // Check if rounds complete
    if (this.currentRound < this.TOTAL_ROUNDS) {
      this.currentRound++;
      // Delay before next round
      setTimeout(() => {
        if (this.gameStarted) { // Check if game still in progress
          this.startRound();
        }
      }, 1500);
    } else {
      // All rounds done
      const average = Math.round(this.roundTimes.reduce((a, b) => a + b, 0) / this.roundTimes.length);

      // Final result handling
      // Update stats
      this.stats.totalPlays++;
      this.stats.reactionTimes.push(average); // Store average as the play record? Or separate? 
      // User probably cares about the average as the "score" for this session.
      this.saveStats();
      this.rankScoresPromise = leaderboard.getScores('reaction-test');

      // Show result modal
      // Show final result
      setTimeout(() => {
        this.awardCoins(30);
        this.showRewardToast('完成遊戲 +30金幣');
        this.showResult(true, average);
        // End game
        this.gameStarted = false;
      }, 1000);
    }
  }

  updateHistoryUI() {
    this.historyList.innerHTML = '';
    this.roundTimes.forEach((time, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>Round ${index + 1}</span> <span class="time">${time}ms</span>`;
      this.historyList.appendChild(li);
    });

    // Update chart
    this.drawChart();
  }

  drawChart() {
    if (!this.chartCtx || this.roundTimes.length === 0) return;

    // Use requestAnimationFrame to ensure we don't start multiple animations overlapping badly
    // or simply cancel previous one if we tracked it. 
    // For simplicity, we just start a new one, as the logic allows overwriting.

    const canvas = this.chartCanvas;
    const ctx = this.chartCtx;
    const width = canvas.width;
    const height = canvas.height;

    // Config
    const padding = { top: 40, right: 40, bottom: 60, left: 50 }; // Increased bottom/left padding
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Data ranges
    const maxTime = Math.max(...this.roundTimes, 500);
    const minTime = 0;
    const timeRange = maxTime - minTime;
    const xStep = chartWidth / (this.TOTAL_ROUNDS - 1); // 0 to 4

    // Start Animation
    this.animateChart(ctx, width, height, padding, chartWidth, chartHeight, xStep, minTime, timeRange, maxTime);
  }

  animateChart(ctx, width, height, padding, chartWidth, chartHeight, xStep, minTime, timeRange, maxTime) {
    const duration = 1500; // 1.5s for smoother feel
    const startTime = performance.now();

    // Easing function: easeOutQuart
    const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const progress = easeOutQuart(rawProgress);

      // 1. Clear everything
      ctx.clearRect(0, 0, width, height);

      // 2. Background
      ctx.fillStyle = '#FFF7ED';
      ctx.fillRect(0, 0, width, height);

      // 3. Draw Grid/Axes (Static)
      ctx.strokeStyle = '#E5E7EB'; // Lighter grid lines
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Horizontal grid lines
      const ySteps = 4;
      for (let i = 0; i <= ySteps; i++) {
        const y = padding.top + (chartHeight / ySteps) * i;
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
      }
      ctx.stroke();

      // Main Axes
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, height - padding.bottom);
      ctx.lineTo(width - padding.right, height - padding.bottom);
      ctx.stroke();

      // 4. Draw Labels (Static)
      ctx.fillStyle = '#18181B';
      ctx.font = 'bold 12px Fredoka, sans-serif'; // Slightly larger font

      // Y-axis labels
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= ySteps; i++) {
        const value = Math.round(maxTime - (maxTime / ySteps) * i);
        const y = padding.top + (chartHeight / ySteps) * i;
        ctx.fillText(`${value}`, padding.left - 10, y);
      }

      // X-axis labels
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let i = 0; i < this.TOTAL_ROUNDS; i++) {
        const x = padding.left + xStep * i;
        ctx.fillText(`R${i + 1}`, x, height - padding.bottom + 15);
      }

      // 5. Draw Data Line (Animated)
      if (this.roundTimes.length > 0) {
        // Calculate total points to draw based on array length? 
        // Or animate the drawing of the full availalbe line?
        // "顺顺的绘制" usually means the line unrolls from left to right.

        ctx.save();
        ctx.beginPath();
        // Clip region to reveal the line from left to right
        ctx.rect(padding.left, padding.top, chartWidth * progress, chartHeight + padding.bottom);
        // Note: Clipping might cut off the line cap/join, so give some buffer or just draw partial line.
        // Drawing partial line is cleaner.
        ctx.restore(); // actually let's calculate partial path

        const totalDistance = (this.roundTimes.length - 1) * xStep;
        const currentDistance = totalDistance * progress; // This logic animates the "length" of the line

        // However, if we want to show all points adjusting, that's different. 
        // Assuming "trend chart appearing", we want the line to draw from R1 to R_current.

        ctx.strokeStyle = '#F97316';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();

        // Draw segments
        // We need to find which segment we are in
        // Total segments = this.roundTimes.length - 1
        // But wait, if we have 5 rounds, we have 4 segments.
        // If we have 1 data point, no line.

        if (this.roundTimes.length === 1) {
          const time = this.roundTimes[0];
          const x = padding.left;
          const y = height - padding.bottom - ((time - minTime) / timeRange) * chartHeight;
          // Just draw point if progress > 0
          if (progress > 0) {
            ctx.fillStyle = '#F97316';
            ctx.beginPath();
            ctx.arc(x, y, 6 * progress, 0, Math.PI * 2); // Animate pop in
            ctx.fill();
          }
        } else {
          // Draw line up to progress
          // We map progress (0-1) to the x-axis range covered by data
          const maxDragX = padding.left + (this.roundTimes.length - 1) * xStep;
          const currentXLimit = padding.left + ((this.roundTimes.length - 1) * xStep) * progress;

          let firstPoint = true;
          for (let i = 0; i < this.roundTimes.length; i++) {
            const time = this.roundTimes[i];
            const x = padding.left + xStep * i;
            const y = height - padding.bottom - ((time - minTime) / timeRange) * chartHeight;

            if (x > currentXLimit + xStep) break; // Optimization

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              const prevX = padding.left + xStep * (i - 1);
              const prevY = height - padding.bottom - ((this.roundTimes[i - 1] - minTime) / timeRange) * chartHeight;

              if (x <= currentXLimit) {
                ctx.lineTo(x, y);
              } else {
                // Interpolate partial segment
                const segmentProgress = (currentXLimit - prevX) / xStep;
                // Avoid tiny artifacts
                if (segmentProgress > 0) {
                  const interX = prevX + (x - prevX) * segmentProgress;
                  const interY = prevY + (y - prevY) * segmentProgress;
                  ctx.lineTo(interX, interY);
                }
              }
            }
          }
          ctx.stroke();

          // Draw points (appearing as line passes them)
          for (let i = 0; i < this.roundTimes.length; i++) {
            const time = this.roundTimes[i];
            const x = padding.left + xStep * i;
            const y = height - padding.bottom - ((time - minTime) / timeRange) * chartHeight;

            if (x <= currentXLimit) {
              // Outer 
              ctx.fillStyle = '#000';
              ctx.beginPath();
              ctx.arc(x, y, 6, 0, Math.PI * 2);
              ctx.fill();

              // Inner 
              ctx.fillStyle = '#F97316';
              ctx.beginPath();
              ctx.arc(x, y, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }

        }
      }

      if (rawProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  showResult(success, data) {
    if (success) {
      const time = data;
      // Show rank preview before leaderboard modal
      this.showRankPreviewThenModal(time);
    } else {
      // Show failure modal
      this.showFailureModal(data);
    }
  }

  showLeaderboardModal(time) {
    // Create modal if not exists
    let modal = document.getElementById('leaderboard-submit-modal');
    const buildModalContent = () => {
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content card" style="max-width: 600px;">
          <div class="modal-header">
            <h2>🏆 遊戲結束</h2>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 1.2rem; text-align: center; margin-bottom: 1rem;">
              你的平均時間: <strong style="color: var(--primary);">${time}ms</strong>
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 1rem;">
              <input type="text" id="player-name-modal" placeholder="輸入名字" maxlength="15" 
                style="border: 3px solid #000; padding: 8px; font-family: inherit; font-weight: bold; flex: 1; max-width: 200px;">
              <button id="submit-score-btn-modal" class="btn btn-primary">提交</button>
            </div>
            <div id="submit-status-modal" style="text-align: center; margin-bottom: 1rem;"></div>
            <h3 style="margin-top: 2rem; margin-bottom: 1rem;">當前排行榜</h3>
            <div id="leaderboard-display-modal" style="max-height: 300px; overflow-y: auto;"></div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 2rem; padding-top: 1rem; border-top: 3px solid var(--border-color);">
              <a href="../../index.html" class="btn btn-secondary">← 返回首頁</a>
              <button id="play-again-btn-reaction" class="btn btn-primary">再玩一次 🎮</button>
            </div>
          </div>
        </div>
      `;
    };

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'leaderboard-submit-modal';
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

    // Update time in modal
    const timeDisplay = modal.querySelector('.modal-body p strong');
    if (timeDisplay) timeDisplay.textContent = `${time}ms`;

    // Show modal
    modal.classList.add('show');

    const display = document.getElementById('leaderboard-display-modal');
    const currentGameId = 'reaction-test';
    const showLeaderboardForGame = async () => {
      return await this.loadLeaderboardData(currentGameId, display);
    };
    showLeaderboardForGame();

    // Bind submit button
    const btn = document.getElementById('submit-score-btn-modal');
    const input = document.getElementById('player-name-modal');
    const status = document.getElementById('submit-status-modal');

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

      const res = await leaderboard.submitScore('reaction-test', name, time);
      if (res.success) {
        status.innerHTML = '<span style="color:green; font-weight:bold;">✅ 已提交！</span>';
        this.clearLeaderboardCache(currentGameId);
        const scores = await showLeaderboardForGame();
        const rank = this.getRankFromResponse(res) ?? this.findLeaderboardRank(scores, name, time);
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
    const playAgainBtn = document.getElementById('play-again-btn-reaction');
    if (playAgainBtn) {
      playAgainBtn.onclick = () => {
        modal.classList.remove('show');
        this.resetGame();
      };
    }
  }

  showFailureModal(message) {
    // Create modal if not exists
    let modal = document.getElementById('failure-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'failure-modal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content card" style="max-width: 500px;">
          <div class="modal-header">
            <h2>❌ 遊戲失敗</h2>
            <button class="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 1.2rem; text-align: center; margin-bottom: 2rem; color: var(--error);">
              ${message}
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
              <a href="../../index.html" class="btn btn-secondary">← 返回首頁</a>
              <button id="play-again-btn-failure" class="btn btn-primary">再玩一次 🎮</button>
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

    // Update message
    const messageEl = modal.querySelector('.modal-body p');
    if (messageEl) messageEl.innerHTML = message;

    // Show modal
    modal.classList.add('show');

    // Bind play again button
    const playAgainBtn = document.getElementById('play-again-btn-failure');
    if (playAgainBtn) {
      playAgainBtn.onclick = () => {
        modal.classList.remove('show');
        this.resetGame();
      };
    }
  }

  resetGame() {
    // Reset UI
    this.gameButton.className = 'game-button waiting';
    this.gameText.textContent = '點擊開始遊戲';
    this.result.classList.add('hidden');
    this.resetBtn.classList.add('hidden');

    // Reset game state
    this.gameStarted = false;
    this.isWaiting = false;
    this.isGreen = false;
    this.currentRound = 1;
    this.roundTimes = [];
    this.startTime = 0;

    // Clear timeout just in case
    clearTimeout(this.timeout);

    this.updateHistoryUI();
  }

  // Stats management
  loadStats() {
    const saved = localStorage.getItem('reactionGameStats');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      totalPlays: 0,
      reactionTimes: [],
      failures: 0
    };
  }

  saveStats() {
    localStorage.setItem('reactionGameStats', JSON.stringify(this.stats));
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
      const scores = await this.getPrefetchedScores('reaction-test');
      rank = this.getPreviewRank(scores, score, true);
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
  new ReactionGame();
});
