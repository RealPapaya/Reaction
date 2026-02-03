/**
 * Reaction Test Game - JavaScript Logic
 * Red Light, Green Light reaction time tester
 */

class ReactionGame {
  constructor() {
    // DOM Elements
    this.gameButton = document.getElementById('game-button');
    this.gameText = document.getElementById('game-text');
    this.startBtn = document.getElementById('start-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.result = document.getElementById('result');
    this.resultTitle = document.getElementById('result-title');
    this.resultMessage = document.getElementById('result-message');

    // Stats elements
    this.totalPlaysEl = document.getElementById('total-plays');
    this.avgTimeEl = document.getElementById('avg-time');
    this.bestTimeEl = document.getElementById('best-time');
    this.successRateEl = document.getElementById('success-rate');
    this.clearStatsBtn = document.getElementById('clear-stats');

    // Modal elements
    this.rulesModal = document.getElementById('rules-modal');
    this.btnRules = document.getElementById('btn-rules');
    this.closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');

    // Game state
    this.isWaiting = false;
    this.isGreen = false;
    this.startTime = null;
    this.timeout = null;

    // Stats from localStorage
    this.stats = this.loadStats();

    // Initialize
    this.init();
  }

  init() {
    // Event listeners
    this.startBtn.addEventListener('click', () => this.startGame());
    this.resetBtn.addEventListener('click', () => this.resetGame());
    this.gameButton.addEventListener('click', () => this.handleClick());
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

    // Display stats
    this.displayStats();

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
    this.startBtn.classList.add('hidden');
    this.result.classList.add('hidden');
    this.resetBtn.classList.add('hidden');

    // Reset state
    this.isWaiting = true;
    this.isGreen = false;

    // Show red light
    this.gameButton.className = 'game-button red';
    this.gameText.textContent = '等待綠燈...';

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

  handleClick() {
    if (!this.isWaiting && !this.isGreen) {
      // Game hasn't started yet
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

    // Visual feedback
    this.gameButton.className = 'game-button early-click';
    this.gameText.textContent = '太早了！';

    // Show result
    this.showResult(false, '失敗！你在紅燈時就點擊了。');

    // Update stats (failed attempt)
    this.stats.totalPlays++;
    this.stats.failures++;
    this.saveStats();
    this.displayStats();
  }

  handleSuccessClick() {
    // Calculate reaction time
    const reactionTime = Date.now() - this.startTime;

    // Update state
    this.isGreen = false;

    // Visual feedback
    this.gameButton.className = 'game-button success-click';
    this.gameText.textContent = `${reactionTime}ms`;

    // Show result
    this.showResult(true, reactionTime);

    // Update stats
    this.stats.totalPlays++;
    this.stats.reactionTimes.push(reactionTime);
    this.saveStats();
    this.displayStats();
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
        <span class="success">${time}ms</span><br>
        <span>${rating}</span>
      `;
    } else {
      this.resultTitle.textContent = '❌ 失敗';
      this.resultMessage.innerHTML = `<span class="error">${data}</span>`;
    }

    // Show reset button
    this.resetBtn.classList.remove('hidden');
  }

  resetGame() {
    // Reset UI
    this.gameButton.className = 'game-button waiting';
    this.gameText.textContent = '點擊「開始遊戲」';
    this.result.classList.add('hidden');
    this.resetBtn.classList.add('hidden');
    this.startBtn.classList.remove('hidden');

    // Clear timeout just in case
    clearTimeout(this.timeout);

    // Reset state
    this.isWaiting = false;
    this.isGreen = false;
    this.startTime = null;
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

  displayStats() {
    // Total plays
    this.totalPlaysEl.textContent = this.stats.totalPlays;

    // Success rate
    const successCount = this.stats.reactionTimes.length;
    const successRate = this.stats.totalPlays > 0
      ? Math.round((successCount / this.stats.totalPlays) * 100)
      : 0;
    this.successRateEl.textContent = this.stats.totalPlays > 0 ? `${successRate}%` : '-';

    // Average time
    if (this.stats.reactionTimes.length > 0) {
      const sum = this.stats.reactionTimes.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / this.stats.reactionTimes.length);
      this.avgTimeEl.textContent = `${avg}ms`;
    } else {
      this.avgTimeEl.textContent = '-';
    }

    // Best time
    if (this.stats.reactionTimes.length > 0) {
      const best = Math.min(...this.stats.reactionTimes);
      this.bestTimeEl.textContent = `${best}ms`;
    } else {
      this.bestTimeEl.textContent = '-';
    }
  }

  clearStats() {
    if (confirm('確定要清除所有統計數據嗎？')) {
      this.stats = {
        totalPlays: 0,
        reactionTimes: [],
        failures: 0
      };
      this.saveStats();
      this.displayStats();
    }
  }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ReactionGame();
});
