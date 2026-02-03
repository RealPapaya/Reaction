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

      // Show result modal
      // Show final result
      setTimeout(() => {
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

    const canvas = this.chartCanvas;
    const ctx = this.chartCtx;
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#FFF7ED';
    ctx.fillRect(0, 0, width, height);

    // Calculate scale
    const maxTime = Math.max(...this.roundTimes, 500);
    const minTime = 0;
    const timeRange = maxTime - minTime;
    const xStep = chartWidth / (this.TOTAL_ROUNDS - 1);

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw Y-axis labels
    ctx.fillStyle = '#18181B';
    ctx.font = 'bold 10px Fredoka, sans-serif';
    ctx.textAlign = 'right';
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const value = Math.round(maxTime - (maxTime / ySteps) * i);
      const y = padding + (chartHeight / ySteps) * i;
      ctx.fillText(`${value}`, padding - 5, y + 3);
    }

    // Draw X-axis labels
    ctx.textAlign = 'center';
    for (let i = 0; i < this.TOTAL_ROUNDS; i++) {
      const x = padding + xStep * i;
      ctx.fillText(`R${i + 1}`, x, height - padding + 15);
    }

    // Animate drawing
    this.animateChart(ctx, padding, height, chartWidth, chartHeight, xStep, minTime, timeRange);
  }

  animateChart(ctx, padding, height, chartWidth, chartHeight, xStep, minTime, timeRange) {
    const duration = 1000; // 1 second animation
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Clear previous frame (only the data area)
      ctx.clearRect(padding, padding - 10, chartWidth + 20, chartHeight + 20);

      // Redraw background for cleared area
      ctx.fillStyle = '#FFF7ED';
      ctx.fillRect(padding, padding - 10, chartWidth + 20, chartHeight + 20);

      // Draw line progressively
      if (this.roundTimes.length > 0) {
        ctx.strokeStyle = '#F97316';
        ctx.fillStyle = '#F97316';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const pointsToDraw = Math.ceil(this.roundTimes.length * progress);

        // Draw line segments
        ctx.beginPath();
        for (let i = 0; i < pointsToDraw; i++) {
          const time = this.roundTimes[i];
          const x = padding + xStep * i;
          const y = height - padding - ((time - minTime) / timeRange) * chartHeight;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Draw points up to current progress
        for (let i = 0; i < pointsToDraw; i++) {
          const time = this.roundTimes[i];
          const x = padding + xStep * i;
          const y = height - padding - ((time - minTime) / timeRange) * chartHeight;

          // Outer black circle
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();

          // Inner orange circle
          ctx.fillStyle = '#F97316';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  showResult(success, data) {
    this.result.classList.remove('hidden');

    if (success) {
      const time = data;
      this.resultTitle.textContent = '✅ 成功！';

      let rating = '';
      if (time < 200) {
        rating = '閃電般快速！⚡';
      } else if (time < 300) {
        rating = '非常優秀！🏆';
      } else if (time < 400) {
        rating = '表現不錯！👍';
      } else {
        rating = '還可以更快！💪';
      }

      this.resultMessage.innerHTML = `
        <div class="result-score">
            <span class="success">平均: ${time}ms</span><br>
            <span>${rating}</span>
        </div>
        <button id="show-leaderboard-btn" class="btn btn-primary" style="margin-top: 1rem;">🏆 提交到排行榜</button>
      `;

      // Bind modal open event
      setTimeout(() => {
        const showBtn = document.getElementById('show-leaderboard-btn');
        if (showBtn) {
          showBtn.onclick = () => this.showLeaderboardModal(time);
        }
      }, 0);

    } else {
      this.resultTitle.textContent = '❌ 失敗';
      this.resultMessage.innerHTML = `<span class="error">${data}</span>`;
    }

    // Show reset button
    this.resetBtn.classList.remove('hidden');
  }

  showLeaderboardModal(time) {
    // Create modal if not exists
    let modal = document.getElementById('leaderboard-submit-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'leaderboard-submit-modal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content card" style="max-width: 600px;">
          <div class="modal-header">
            <h2>🏆 提交成績</h2>
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

    // Update time in modal
    const timeDisplay = modal.querySelector('.modal-body p strong');
    if (timeDisplay) timeDisplay.textContent = `${time}ms`;

    // Show modal
    modal.classList.add('show');

    // Load leaderboard
    const loadLeaderboard = async () => {
      const display = document.getElementById('leaderboard-display-modal');
      display.innerHTML = '<p style="text-align: center;">載入中...</p>';
      const scores = await leaderboard.getScores('reaction-test');
      if (scores && scores.length > 0) {
        let html = '<table style="width:100%; border-collapse: collapse;">';
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
        html += '</tbody></table>';
        display.innerHTML = html;
      } else {
        display.innerHTML = '<p style="text-align: center; color: #666;">尚無紀錄或無法連接</p>';
      }
    };

    loadLeaderboard();

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


}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ReactionGame();
});
