// ====================================
// Horse Racing Game - Main Logic
// ====================================

class HorseRacingGame {
    constructor() {
        // DOM elements
        this.balanceDisplay = document.getElementById('balance');
        this.timerDisplay = document.getElementById('timer');
        this.raceStatusDisplay = document.getElementById('race-status');
        this.horsesContainer = document.getElementById('horses-container');
        this.betsDisplay = document.getElementById('bets-display');
        this.totalBetDisplay = document.getElementById('total-bet');
        this.raceSection = document.getElementById('race-section');
        this.raceCanvas = document.getElementById('race-canvas');
        this.historyContainer = document.getElementById('history-container');

        // Modals
        this.betModal = document.getElementById('bet-modal');
        this.resultModal = document.getElementById('result-modal');

        // Game state
        this.balance = 10000;
        this.horses = [];
        this.bets = [];
        this.raceNumber = 0;
        this.history = [];

        // Timer
        this.timeRemaining = 120; // 2 minutes
        this.timerInterval = null;
        this.oddsInterval = null;

        // Race engine
        this.raceEngine = null;

        // Current betting horse
        this.currentBettingHorse = null;
        this.currentBetAmount = 0;

        // Game phases
        this.phase = 'BETTING'; // BETTING, RACING, RESULTS

        // Initialize
        this.init();
    }

    // ====================================
    // Initialization
    // ====================================

    init() {
        // Generate horses
        this.horses = generateHorses();

        // Calculate initial odds
        this.calculateOdds();

        // Render UI
        this.renderHorses();
        this.updateDisplay();

        // Start timer
        this.startTimer();

        // Start odds updates (every 15 seconds)
        this.startOddsUpdates();

        // Event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Modal close buttons
        document.querySelectorAll('.close-modal, .close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.betModal.classList.remove('show');
                this.resultModal.classList.remove('show');
            });
        });

        // Chip buttons
        document.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                this.selectBetAmount(amount);
            });
        });

        // Custom amount input
        document.getElementById('custom-amount').addEventListener('input', (e) => {
            const amount = parseInt(e.target.value) || 0;
            this.selectBetAmount(amount);
        });

        // Confirm bet button
        document.getElementById('confirm-bet-btn').addEventListener('click', () => {
            this.confirmBet();
        });
    }

    // ====================================
    // Timer Management
    // ====================================

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                this.endBettingPhase();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // ====================================
    // Odds Management
    // ====================================

    startOddsUpdates() {
        // Update odds every 15 seconds
        this.oddsInterval = setInterval(() => {
            if (this.phase === 'BETTING') {
                this.updateOdds();
            }
        }, 15000);
    }

    calculateOdds() {
        // Calculate total pool
        const totalPool = this.bets.reduce((sum, bet) => sum + bet.amount, 0) || 1;

        this.horses.forEach(horse => {
            // Get bets on this horse
            const horseBets = this.bets
                .filter(bet => bet.horseId === horse.id)
                .reduce((sum, bet) => sum + bet.amount, 0);

            // Base odds from competitive factor
            const baseOdds = 1 / horse.competitiveFactor;

            // Adjust based on betting pool (popular horses get lower odds)
            const betRatio = horseBets / totalPool;
            const poolAdjustment = 1 - (betRatio * 0.5);

            // Random fluctuation ±5%
            const randomFactor = randomFloat(0.95, 1.05);

            // Calculate final odds
            let finalOdds = baseOdds * poolAdjustment * randomFactor;

            // Clamp between 1.1 and 50
            finalOdds = Math.max(1.1, Math.min(50, finalOdds));

            // Store previous odds
            horse.previousOdds = horse.odds;
            horse.odds = parseFloat(finalOdds.toFixed(2));
        });
    }

    // ====================================
    // UI Rendering
    // ====================================

    updateOdds() {
        this.calculateOdds();

        // If list exists, perform smart update with animation
        const list = this.horsesContainer.querySelector('.program-list');
        if (list) {
            this.updateOddsValues();
        } else {
            this.renderHorses();
        }
    }

    updateOddsValues() {
        this.horses.forEach(horse => {
            const oddsCard = document.getElementById(`odds-card-${horse.id}`);
            const oddsElement = document.getElementById(`odds-val-${horse.id}`);
            const changeElement = document.getElementById(`odds-change-${horse.id}`);

            if (oddsCard && oddsElement && changeElement) {
                // Check if odds actually changed to trigger animation
                const currentText = parseFloat(oddsElement.textContent);
                if (currentText !== horse.odds) {
                    // Trigger Flip Animation on the CARD
                    oddsCard.classList.remove('flipping');
                    void oddsCard.offsetWidth; // Trigger reflow
                    oddsCard.classList.add('flipping');

                    // Update text halfway through animation to hide the swap (at 90deg)
                    setTimeout(() => {
                        oddsElement.textContent = horse.odds;

                        // Update change indicator
                        let oddsChangeHtml = '';
                        if (horse.previousOdds > 0) {
                            if (horse.odds > horse.previousOdds) {
                                oddsChangeHtml = '<span class="odds-change up">↑</span>';
                            } else if (horse.odds < horse.previousOdds) {
                                oddsChangeHtml = '<span class="odds-change down">↓</span>';
                            }
                        }
                        changeElement.innerHTML = oddsChangeHtml;
                    }, 300); // Half of 600ms animation
                }
            }
        });
    }

    renderHorses() {
        this.horsesContainer.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'program-list';

        // Header Row (Now separated from Action placeholder)
        container.innerHTML = `
            <div class="row-wrapper header-wrapper">
                <div class="action-placeholder"></div>
                <div class="program-header">
                    <div class="cell-odds">賠率</div>
                    <div class="cell-horse">馬名</div>
                    <div class="cell-info">年齡/性別</div>
                    <div class="cell-body-weight">體重 (增減)</div>
                    <div class="cell-weight">負磅</div>
                    <div class="cell-jockey">騎手</div>
                    <div class="cell-trend">近五場走勢</div>
                </div>
            </div>
            <div class="program-body">
                ${this.horses.map(horse => {
            // Odds status
            let oddsChange = '';
            if (horse.previousOdds > 0) {
                if (horse.odds > horse.previousOdds) {
                    oddsChange = '<span class="odds-change up">↑</span>';
                } else if (horse.odds < horse.previousOdds) {
                    oddsChange = '<span class="odds-change down">↓</span>';
                }
            }

            // Weight change
            const weightChangeText = horse.weightChange >= 0 ? `+${horse.weightChange}` : horse.weightChange;
            const weightChangeClass = horse.weightChange > 0 ? 'up' : (horse.weightChange < 0 ? 'down' : '');

            // Trend balls
            const trendHtml = horse.lastFiveTrend.map(rank => {
                let colorClass = '';
                if (rank === 1) colorClass = 'rank-1';
                else if (rank === 2) colorClass = 'rank-2';
                else if (rank === 3) colorClass = 'rank-3';
                return `<span class="trend-ball ${colorClass}">${rank}</span>`;
            }).join('');

            return `
                        <div class="row-wrapper">
                            <div class="cell-action">
                                <button class="btn btn-secondary bet-btn" data-horse-id="${horse.id}" ${this.phase !== 'BETTING' ? 'disabled' : ''}>
                                    下注
                                </button>
                            </div>
                            <div class="program-row">
                                <div class="cell-odds">
                                    <div id="odds-card-${horse.id}" class="odds-card">
                                        <span id="odds-val-${horse.id}" class="odds-val">${horse.odds}</span>
                                        <span id="odds-change-${horse.id}">${oddsChange}</span>
                                    </div>
                                </div>
                                <div class="cell-horse">
                                    <span class="horse-num">${horse.id}</span>
                                    <span class="horse-name">${horse.name}</span>
                                </div>
                                <div class="cell-info">${horse.age}歲 / ${horse.gender}</div>
                                <div class="cell-body-weight">
                                    <span class="body-val">${horse.weight}kg</span>
                                    <span class="weight-change ${weightChangeClass}">(${weightChangeText})</span>
                                </div>
                                <div class="cell-weight">${horse.weightCarried}磅</div>
                                <div class="cell-jockey">
                                    <span class="jockey-flag">${horse.jockey.flag}</span>
                                    <span class="jockey-name">${horse.jockey.name}</span>
                                    <div class="jockey-country">${horse.jockey.country}</div>
                                </div>
                                <div class="cell-trend">
                                    <div class="trend-container">${trendHtml}</div>
                                </div>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;

        // Add bet button listeners
        container.querySelectorAll('.bet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const horseId = parseInt(e.currentTarget.dataset.horseId);
                const horse = this.horses.find(h => h.id === horseId);
                this.openBetModal(horse);
            });
        });

        this.horsesContainer.appendChild(container);
    }

    updateDisplay() {
        this.balanceDisplay.textContent = `$${this.balance.toLocaleString()}`;
        this.renderBets();
        this.renderHistory();
    }

    renderBets() {
        if (this.bets.length === 0) {
            this.betsDisplay.innerHTML = '<p class="no-bets">尚未下注</p>';
            this.totalBetDisplay.textContent = '$0';
            return;
        }

        const totalBet = this.bets.reduce((sum, bet) => sum + bet.amount, 0);

        this.betsDisplay.innerHTML = this.bets.map(bet => {
            const horse = this.horses.find(h => h.id === bet.horseId);
            const potential = (bet.amount * bet.odds).toFixed(0);

            return `
                <div class="bet-item">
                    <div>
                        <span class="bet-horse-name">${horse.id}號 ${horse.name}</span>
                        <div class="bet-potential">預期獲利: $${potential}</div>
                    </div>
                    <div class="bet-amount">$${bet.amount}</div>
                </div>
            `;
        }).join('');

        this.totalBetDisplay.textContent = `$${totalBet.toLocaleString()}`;
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyContainer.innerHTML = '<p class="no-history">暫無紀錄</p>';
            return;
        }

        this.historyContainer.innerHTML = this.history.slice(-10).reverse().map(record => {
            const resultClass = record.profit >= 0 ? 'win' : 'lose';
            const profitText = record.profit >= 0 ? `+$${record.profit}` : `-$${Math.abs(record.profit)}`;

            return `
                <div class="history-item">
                    <div class="history-race-number">第 ${record.raceNumber} 場</div>
                    <div class="history-winner">🏆 ${record.winner.id}號 ${record.winner.name} (${record.winner.odds}x)</div>
                    <div class="history-result ${resultClass}">${profitText}</div>
                </div>
            `;
        }).join('');
    }

    // ====================================
    // Betting Methods
    // ====================================

    openBetModal(horse) {
        if (this.phase !== 'BETTING') return;

        this.currentBettingHorse = horse;
        this.currentBetAmount = 0;

        // Update modal content
        document.getElementById('modal-horse-name').textContent = `${horse.id}號 - ${horse.name}`;
        document.getElementById('modal-horse-details').textContent =
            `${horse.gender} ${horse.age}歲 ${horse.weight}kg ${horse.height}cm`;
        document.getElementById('modal-jockey-details').textContent =
            `騎手: ${horse.jockey.name} (${horse.jockey.weight}kg, ${horse.jockey.experience}年)`;
        document.getElementById('modal-odds').textContent = `${horse.odds}x`;

        // Reset selection
        document.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('custom-amount').value = '';
        this.updateBetPreview();

        // Show modal
        this.betModal.classList.add('show');
    }

    selectBetAmount(amount) {
        this.currentBetAmount = amount;

        // Update chip button selection
        document.querySelectorAll('.chip-btn').forEach(btn => {
            if (parseInt(btn.dataset.amount) === amount) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        this.updateBetPreview();
    }

    updateBetPreview() {
        const amount = this.currentBetAmount;
        const profit = (amount * this.currentBettingHorse.odds).toFixed(0);

        document.getElementById('preview-amount').textContent = `$${amount.toLocaleString()}`;
        document.getElementById('preview-profit').textContent = `$${profit.toLocaleString()}`;
    }

    confirmBet() {
        if (this.currentBetAmount <= 0) {
            alert('請選擇投注金額');
            return;
        }

        if (this.currentBetAmount > this.balance) {
            alert('餘額不足');
            return;
        }

        // Add bet
        this.bets.push({
            horseId: this.currentBettingHorse.id,
            amount: this.currentBetAmount,
            odds: this.currentBettingHorse.odds
        });

        // Deduct balance
        this.balance -= this.currentBetAmount;

        // Update UI
        this.updateDisplay();
        this.betModal.classList.remove('show');

        // Recalculate odds
        this.calculateOdds();
        this.updateOdds();
    }

    // ====================================
    // Race Management
    // ====================================

    endBettingPhase() {
        clearInterval(this.timerInterval);
        clearInterval(this.oddsInterval);

        this.phase = 'RACING';
        this.raceStatusDisplay.textContent = '比賽中';
        this.raceStatusDisplay.classList.add('racing');

        // Show race section
        this.raceSection.classList.remove('hidden');

        // Disable bet buttons
        document.querySelectorAll('.bet-btn').forEach(btn => btn.disabled = true);

        // Start race
        setTimeout(() => {
            this.startRace();
        }, 1000);
    }

    startRace() {
        this.raceEngine = new RaceEngine(this.raceCanvas, this.horses);
        this.raceEngine.startRace();

        // Wait for race to finish
        setTimeout(() => {
            this.endRace();
        }, 32000); // 30 seconds race + 2 seconds buffer
    }

    endRace() {
        this.phase = 'RESULTS';

        // Get results
        const results = this.raceEngine.getResults();
        const winner = results[0].horse;

        // Calculate payout
        const payout = this.calculatePayout(winner);
        const profit = payout - this.bets.reduce((sum, bet) => sum + bet.amount, 0);

        // Update balance
        this.balance += payout;

        // Record history
        this.raceNumber++;
        this.history.push({
            raceNumber: this.raceNumber,
            winner: winner,
            profit: profit
        });

        // Show result modal
        this.showResultModal(winner, results, payout, profit);

        // Reset for next race
        setTimeout(() => {
            this.startNextRace();
        }, 10000); // 10 seconds to review results
    }

    calculatePayout(winner) {
        let totalPayout = 0;

        this.bets.forEach(bet => {
            if (bet.horseId === winner.id) {
                totalPayout += bet.amount * bet.odds;
            }
        });

        return totalPayout;
    }

    showResultModal(winner, results, payout, profit) {
        // Update modal content
        document.getElementById('winner-name').textContent = `${winner.id}號 - ${winner.name}`;

        // Ranking list
        const rankingHTML = results.map((result, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[index] || `${index + 1}.`;
            return `
                <div class="ranking-item">
                    ${medal} ${result.horse.id}號 ${result.horse.name}
                </div>
            `;
        }).join('');

        document.getElementById('ranking-list').innerHTML = rankingHTML;

        // Payout display
        const payoutDisplay = document.querySelector('.payout-display');
        if (profit > 0) {
            payoutDisplay.classList.remove('loss');
            document.getElementById('result-message').textContent = '🎉 恭喜中獎！';
            document.getElementById('payout-amount').innerHTML = `<strong>+$${profit.toLocaleString()}</strong>`;
        } else {
            payoutDisplay.classList.add('loss');
            document.getElementById('result-message').textContent = '很遺憾，未中獎';
            document.getElementById('payout-amount').innerHTML = `<strong>$${profit.toLocaleString()}</strong>`;
        }

        document.getElementById('new-balance').textContent = `$${this.balance.toLocaleString()}`;

        // Show modal
        this.resultModal.classList.add('show');
    }

    startNextRace() {
        // Reset
        this.bets = [];
        this.timeRemaining = 120;
        this.phase = 'BETTING';
        this.raceStatusDisplay.textContent = '投注中';
        this.raceStatusDisplay.classList.remove('racing');

        // Hide race section
        this.raceSection.classList.add('hidden');

        // Generate new horses
        this.horses = generateHorses();
        this.calculateOdds();

        // Update UI
        this.renderHorses();
        this.updateDisplay();

        // Restart timers
        this.startTimer();
        this.startOddsUpdates();
    }
}

// ====================================
// Start Game
// ====================================

const game = new HorseRacingGame();
