// ====================================
// Horse Racing Game - Separate Venues and Betting
// ====================================

class HorseRacingGame {
    constructor() {
        this.balance = 10000;
        this.currentScreen = 'venues';
        this.selectedTrackId = null;
        this.currentBetAmount = 0;
        this.currentBettingHorse = null;

        // Stats
        this.totalBet = 0;
        this.totalProfit = 0;
        this.winCount = 0;
        this.totalBets = 0;

        // Race engine for viewing
        this.raceEngine = null;
        this.updateInterval = null;

        this.dom = {};
        this.init();
    }

    init() {
        this.cacheDOMElements();
        this.setupEventListeners();
        this.loadBalance();
        this.loadStats();
        this.renderVenuesScreen();
        this.startGlobalUpdate();
    }

    cacheDOMElements() {
        this.dom.globalBackBtn = document.querySelector('.global-back-btn');
        this.dom.navContainer = document.querySelector('.main-nav-bottom');
        this.dom.navBtns = document.querySelectorAll('.nav-btn-bottom');
        this.dom.screens = document.querySelectorAll('.screen');

        // Venues
        this.dom.venuesCardsContainer = document.getElementById('venues-cards-container');

        // Betting Machine
        this.dom.bettingTrackList = document.getElementById('betting-track-list');

        // Balance
        this.dom.balanceAmount = document.getElementById('balance-amount');
        this.dom.totalBet = document.getElementById('total-bet');
        this.dom.totalProfit = document.getElementById('total-profit');
        this.dom.winRate = document.getElementById('win-rate');

        // My Bets
        this.dom.activeTickets = document.getElementById('active-tickets');
        this.dom.activeCount = document.getElementById('active-count');
        this.dom.redeemableTickets = document.getElementById('redeemable-tickets');
        this.dom.redeemableCount = document.getElementById('redeemable-count');
        this.dom.betHistory = document.getElementById('bet-history');

        // Betting Detail
        this.dom.bettingDetailTitle = document.getElementById('betting-detail-title');
        this.dom.bettingHorsesContainer = document.getElementById('betting-horses-container');

        // Modals
        this.dom.raceModal = document.getElementById('race-modal');
        this.dom.quickBetModal = document.getElementById('quick-bet-modal');
        this.dom.scanningOverlay = document.getElementById('scanning-overlay');
        this.dom.scanningMessage = document.getElementById('scanning-message');
        this.dom.scanningProgressBar = document.getElementById('scanning-progress-bar');
    }

    setupEventListeners() {
        // Navigation
        this.dom.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchScreen(btn.dataset.screen);
            });
        });

        // Back to betting
        document.getElementById('back-to-betting')?.addEventListener('click', () => {
            this.switchScreen('betting');
        });

        // Modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.raceModal?.classList.remove('show');
                this.dom.quickBetModal?.classList.remove('show');

                // Restore navigation bar
                if (this.dom.navContainer) {
                    this.dom.navContainer.style.display = 'flex';
                }

                // Restore global back button
                if (this.dom.globalBackBtn) {
                    this.dom.globalBackBtn.style.display = 'block';
                }
            });
        });

        // Chip buttons
        document.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectBetAmount(parseInt(e.target.dataset.amount));
            });
        });

        document.getElementById('quick-bet-amount')?.addEventListener('input', (e) => {
            this.selectBetAmount(parseInt(e.target.value) || 0);
        });

        document.getElementById('confirm-quick-bet-btn')?.addEventListener('click', () => {
            this.confirmQuickBet();
        });
    }

    switchScreen(screenName) {
        this.currentScreen = screenName;

        // Update navigation buttons
        this.dom.navBtns.forEach(btn => {
            if (btn.dataset.screen === screenName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Switch screens with proper animation - FIXED
        this.dom.screens.forEach(screen => {
            if (screen.id === `${screenName}-screen`) {
                // Show the target screen
                screen.classList.remove('fade-out');
                screen.classList.add('active', 'fade-in');
            } else {
                // Hide other screens
                screen.classList.remove('fade-in');
                // Only add fade-out to screens that are currently active
                if (screen.classList.contains('active')) {
                    screen.classList.add('fade-out');
                }
                screen.classList.remove('active');
            }
        });

        // Render appropriate screen content
        if (screenName === 'venues') {
            this.renderVenuesScreen();
        } else if (screenName === 'betting') {
            this.renderBettingMachineScreen();
        } else if (screenName === 'balance') {
            this.renderBalanceScreen();
        } else if (screenName === 'my-bets') {
            this.renderMyBetsScreen();
        }
    }

    // ====================================
    // Venues Screen
    // ====================================

    renderVenuesScreen() {
        const statuses = raceScheduler.getAllTrackStatuses();

        this.dom.venuesCardsContainer.innerHTML = statuses.map(status => {
            const track = raceScheduler.getTrackData(status.trackId);

            // Determine if view button should be enabled
            // Can view: PRE_RACE, RACING, POST_RACE
            // Cannot view: BETTING, CLOSED
            const canView = ['PRE_RACE', 'RACING', 'POST_RACE'].includes(status.phase);
            const btnClass = canView ? 'btn-primary' : 'btn-secondary';
            const btnDisabled = canView ? '' : 'disabled';

            return `
                <div class="track-card" data-track-id="${status.trackId}">
                    <div class="track-card-header">
                        <div class="track-card-title">
                            <span class="track-card-flag">${status.flagEmoji}</span>
                            <h3>${status.trackName}</h3>
                        </div>
                        <div class="track-card-timer ${status.phase}">
                            ${this.formatTime(status.timeRemaining)}
                        </div>
                    </div>
                    <div class="track-card-info">
                        <div class="track-info-item">
                            <span class="track-info-label">場次</span>
                            <span class="track-info-value">第 ${status.raceNumber} 場</span>
                        </div>
                        <div class="track-info-item">
                            <span class="track-info-label">狀態</span>
                            <span class="track-info-value status-${status.phase}">${status.message}</span>
                        </div>
                        <div class="track-info-item">
                            <span class="track-info-label">賽道</span>
                            <span class="track-info-value">${track.surfaceDisplay}</span>
                        </div>
                    </div>
                    <div class="track-card-actions">
                        <button class="btn ${btnClass} track-view-btn" 
                                data-track-id="${status.trackId}"
                                ${btnDisabled}>
                            ${canView ? '觀看比賽' : '無法觀看'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners only to enabled buttons
        this.dom.venuesCardsContainer.querySelectorAll('.track-view-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                this.viewRace(btn.dataset.trackId);
            });
        });
    }

    // ====================================
    // Betting Machine Screen
    // ====================================

    renderBettingMachineScreen() {
        const statuses = raceScheduler.getAllTrackStatuses();

        this.dom.bettingTrackList.innerHTML = statuses.map(status => {
            const canBet = status.phase === 'BETTING';
            const btnClass = canBet ? 'btn-primary' : 'btn-secondary';

            return `
                <button class="track-select-btn btn ${btnClass}"
                        data-track-id="${status.trackId}"
                        ${!canBet ? 'disabled' : ''}>
                    <div class="track-select-info">
                        <span class="track-select-flag">${status.flagEmoji}</span>
                        <div class="track-select-details">
                            <h4>${status.trackName}</h4>
                            <p>第 ${status.raceNumber} 場 · ${status.message}</p>
                        </div>
                    </div>
                    <div class="track-select-timer">${this.formatTime(status.timeRemaining)}</div>
                </button>
                `;
        }).join('');

        this.dom.bettingTrackList.querySelectorAll('.track-select-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                this.goToBettingDetail(btn.dataset.trackId);
            });
        });
    }

    goToBettingDetail(trackId) {
        this.selectedTrackId = trackId;
        const status = raceScheduler.getTrackStatus(trackId);
        const track = raceScheduler.getTrackData(trackId);
        const horses = raceScheduler.getOrGenerateHorses(trackId);

        // Calculate odds - ALWAYS recalculate for fresh data
        horses.forEach(horse => {
            const factor = horse.competitiveFactor;

            // Store previous odds for change indicator
            horse.previousOdds = horse.odds || 0;

            // Always recalculate odds
            const safeFactor = (factor && factor > 0) ? factor : 0.1;
            const rawOdds = 1 / safeFactor;
            const clampedOdds = Math.max(1.5, Math.min(50, rawOdds));
            horse.odds = parseFloat(clampedOdds.toFixed(2));
        });

        this.dom.bettingDetailTitle.textContent = `${track.flagEmoji} ${track.name} - 第 ${status.raceNumber} 場 · ${this.formatTime(status.timeRemaining)} `;

        // Track current screen state - FIXED
        this.currentScreen = 'betting-detail';

        this.renderHorsesTable(horses, trackId);

        // Properly show betting detail screen - FIXED
        this.dom.screens.forEach(screen => {
            if (screen.id === 'betting-detail-screen') {
                screen.classList.remove('fade-out');
                screen.classList.add('active', 'fade-in');
            } else {
                screen.classList.remove('fade-in');
                if (screen.classList.contains('active')) {
                    screen.classList.add('fade-out');
                }
                screen.classList.remove('active');
            }
        });

        // Update navigation to deselect all buttons
        this.dom.navBtns.forEach(btn => {
            btn.classList.remove('active');
        });
    }

    renderHorsesTable(horses, trackId) {
        const container = document.createElement('div');
        container.className = 'program-list';

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
            </div >
                <div class="program-body">
                    ${horses.map(horse => this.createHorseRow(horse, trackId)).join('')}
                </div>
            `;

        container.querySelectorAll('.bet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const horseId = parseInt(e.currentTarget.dataset.horseId);
                const horse = horses.find(h => h.id === horseId);
                this.openQuickBetModal(trackId, horseId, horse.odds);
            });
        });

        this.dom.bettingHorsesContainer.innerHTML = '';
        this.dom.bettingHorsesContainer.appendChild(container);
    }

    createHorseRow(horse, trackId) {
        let oddsChange = '';
        if (horse.previousOdds > 0) {
            if (horse.odds > horse.previousOdds) {
                oddsChange = '<span class="odds-change up">↑</span>';
            } else if (horse.odds < horse.previousOdds) {
                oddsChange = '<span class="odds-change down">↓</span>';
            }
        }

        const weightChangeText = horse.weightChange >= 0 ? `+ ${horse.weightChange} ` : horse.weightChange;
        const weightChangeClass = horse.weightChange > 0 ? 'up' : (horse.weightChange < 0 ? 'down' : '');

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
                    <button class="btn btn-secondary bet-btn" data-horse-id="${horse.id}">
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
    }

    // ====================================
    // Balance Screen
    // ====================================

    renderBalanceScreen() {
        this.dom.balanceAmount.textContent = `$${this.balance.toLocaleString()} `;
        this.dom.totalBet.textContent = `$${this.totalBet.toLocaleString()} `;
        this.dom.totalProfit.textContent = `$${this.totalProfit.toLocaleString()} `;

        const winRate = this.totalBets > 0 ? ((this.winCount / this.totalBets) * 100).toFixed(1) : 0;
        this.dom.winRate.textContent = `${winRate}% `;

        if (this.totalProfit > 0) {
            this.dom.totalProfit.classList.add('win');
            this.dom.totalProfit.classList.remove('loss');
        } else if (this.totalProfit < 0) {
            this.dom.totalProfit.classList.add('loss');
            this.dom.totalProfit.classList.remove('win');
        }
    }

    // ====================================
    // My Bets Screen
    // ====================================

    renderMyBetsScreen() {
        const tickets = bettingMachine.getAllTickets();
        const active = tickets.filter(t => t.status === 'active');
        const redeemable = tickets.filter(t => t.status === 'redeemable');
        const redeemed = redemptionMachine.getRedemptionHistory();

        // Active tickets
        this.dom.activeCount.textContent = active.length;
        if (active.length === 0) {
            this.dom.activeTickets.innerHTML = '<p class="no-tickets">暫無進行中的投注</p>';
        } else {
            this.dom.activeTickets.innerHTML = active.map(ticket => this.renderTicketCard(ticket)).join('');
        }

        // Redeemable tickets
        this.dom.redeemableCount.textContent = redeemable.length;
        if (redeemable.length === 0) {
            this.dom.redeemableTickets.innerHTML = '<p class="no-tickets">暫無可兌獎的投注單</p>';
        } else {
            this.dom.redeemableTickets.innerHTML = redeemable.map(ticket => this.renderTicketCard(ticket, true)).join('');
        }

        // History
        if (redeemed.length === 0) {
            this.dom.betHistory.innerHTML = '<p class="no-history">暫無紀錄</p>';
        } else {
            this.dom.betHistory.innerHTML = redeemed.map(record => this.renderHistoryCard(record)).join('');
        }

        // Add event listeners for redemption buttons
        this.dom.redeemableTickets.querySelectorAll('.redeem-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.redeemTicket(btn.dataset.ticketId);
            });
        });
    }

    renderTicketCard(ticket, showRedeemBtn = false) {
        const track = raceScheduler.getTrackData(ticket.trackId);
        const horses = raceScheduler.getOrGenerateHorses(ticket.trackId);
        const horse = horses.find(h => h.id === ticket.horseId);

        return `
                < div class="ticket-card" >
                <div class="ticket-header">
                    <span class="ticket-id">#{ticket.ticketId}</span>
                    <span class="ticket-status status-${ticket.status}">${ticket.status === 'active' ? '進行中' : '可兌獎'}</span>
                </div>
                <div class="ticket-body">
                    <div class="ticket-info">
                        <p><strong>${track.flagEmoji} ${track.name}</strong> - 第 ${ticket.raceNumber} 場</p>
                        <p>投注馬匹: ${ticket.horseId}號 - ${horse?.name || '未知'}</p>
                        <p>投注金額: $${ticket.amount.toLocaleString()}</p>
                        <p>賠率: ${ticket.odds}x</p>
                    </div>
                </div>
                ${showRedeemBtn ? `
                    <div class="ticket-actions">
                        <button class="btn btn-primary redeem-btn" data-ticket-id="${ticket.ticketId}">
                            兌獎
                        </button>
                    </div>
                ` : ''
            }
            </div >
                `;
    }

    renderHistoryCard(record) {
        const resultClass = record.result.isWinner ? 'win' : 'loss';
        const resultText = record.result.isWinner ? '✅ 中獎' : '❌ 未中獎';

        return `
                < div class="history-card ${resultClass}" >
                <div class="history-header">
                    <span class="history-id">#{record.ticketId}</span>
                    <span class="history-result">${resultText}</span>
                </div>
                <div class="history-body">
                    <p>${record.trackName} - 第 ${record.raceNumber} 場</p>
                    <p>投注: ${record.horseId}號 · $${record.amount.toLocaleString()}</p>
                    ${record.result.isWinner ? `<p class="win-amount">獲利: $${record.result.payout.toLocaleString()}</p>` : ''}
                </div>
            </div >
                `;
    }

    async redeemTicket(ticketId) {
        this.dom.scanningOverlay.classList.remove('hidden');
        this.dom.scanningMessage.textContent = '正在掃描投注單...';
        this.dom.scanningProgressBar.style.width = '0%';

        try {
            // Simulate scanning animation
            await new Promise(resolve => {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    this.dom.scanningProgressBar.style.width = `${progress}% `;
                    if (progress >= 100) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });

            this.dom.scanningMessage.textContent = '正在兌獎...';

            const ticket = bettingMachine.getTicket(ticketId);
            const result = redemptionMachine.redeemTicket(ticketId);

            this.dom.scanningOverlay.classList.add('hidden');

            if (result.isWinner) {
                this.balance += result.payout;
                this.winCount++;
                this.totalProfit += (result.payout - ticket.amount);
            } else {
                this.totalProfit -= ticket.amount;
            }
            this.totalBets++;

            this.saveBalance();
            this.saveStats();

            const resultMessage = ticket.result.isWinner
                ? `🎉 恭喜中獎!\n獲利: $${ticket.result.payout.toLocaleString()} `
                : `😔 很遺憾, 未中獎`;

            alert(resultMessage);
            this.renderMyBetsScreen();

        } catch (error) {
            this.dom.scanningOverlay.classList.add('hidden');
            alert(`❌ 兌獎失敗: ${error.message} `);
        }
    }

    // ====================================
    // Race Viewing with Fullscreen
    // ====================================

    viewRace(trackId) {
        this.selectedTrackId = trackId;
        const status = raceScheduler.getTrackStatus(trackId);
        const track = raceScheduler.getTrackData(trackId);

        document.getElementById('race-modal-title').textContent = `${track.flagEmoji} ${track.name} - 第 ${status.raceNumber} 場`;
        document.getElementById('race-modal-status').textContent = status.message;
        document.getElementById('race-modal-timer').textContent = this.formatTime(status.timeRemaining);

        this.dom.raceModal.classList.add('show');

        // Hide navigation bar for full immersion
        if (this.dom.navContainer) {
            this.dom.navContainer.style.display = 'none';
        }

        // Hide global back button for full immersion
        if (this.dom.globalBackBtn) {
            this.dom.globalBackBtn.style.display = 'none';
        }

        if (status.phase === 'RACING') {
            this.startRaceViewing(trackId);
        } else {
            document.getElementById('race-waiting').style.display = 'block';
            document.getElementById('race-canvas').style.display = 'none';
        }
    }

    startRaceViewing(trackId) {
        const canvas = document.getElementById('race-canvas');
        const horses = raceScheduler.getOrGenerateHorses(trackId);
        const track = raceScheduler.getTrackData(trackId);

        document.getElementById('race-waiting').style.display = 'none';
        canvas.style.display = 'block';

        if (this.raceEngine) {
            this.raceEngine.stopRace();
        }

        this.raceEngine = new RaceEngine(canvas, horses, track);
        this.raceEngine.startRace();
    }

    // ====================================
    // Betting Modal
    // ====================================

    openQuickBetModal(trackId, horseId, odds) {
        const horses = raceScheduler.getOrGenerateHorses(trackId);
        const horse = horses.find(h => h.id === horseId);

        this.currentBettingHorse = { trackId, horseId, odds };
        this.currentBetAmount = 0;

        document.getElementById('quick-bet-horse-name').textContent = `${horse.id} 號 - ${horse.name} `;
        document.getElementById('quick-bet-odds').textContent = `${odds} x`;

        document.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('quick-bet-amount').value = '';
        this.updateBetPreview();

        this.dom.quickBetModal.classList.add('show');
    }

    selectBetAmount(amount) {
        this.currentBetAmount = amount;

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
        if (!this.currentBettingHorse) return;

        const amount = this.currentBetAmount;
        const profit = (amount * this.currentBettingHorse.odds).toFixed(0);

        document.getElementById('quick-bet-preview-amount').textContent = `$${amount.toLocaleString()} `;
        document.getElementById('quick-bet-preview-profit').textContent = `$${profit.toLocaleString()} `;
    }

    confirmQuickBet() {
        if (this.currentBetAmount <= 0) {
            alert('請選擇投注金額');
            return;
        }

        if (this.currentBetAmount > this.balance) {
            alert('餘額不足');
            return;
        }

        try {
            const ticket = bettingMachine.createTicket(
                this.currentBettingHorse.trackId,
                this.currentBettingHorse.horseId,
                this.currentBetAmount,
                this.currentBettingHorse.odds
            );

            this.balance -= this.currentBetAmount;
            this.totalBet += this.currentBetAmount;
            this.saveBalance();
            this.saveStats();

            this.dom.quickBetModal.classList.remove('show');

            alert(`✅ 投注成功!\n投注單號: ${ticket.ticketId} \n請至「我的投注」查看`);

        } catch (error) {
            alert(`❌ 投注失敗: ${error.message} `);
        }
    }

    // ====================================
    // Global Updates
    // ====================================

    startGlobalUpdate() {
        this.updateInterval = setInterval(() => {
            if (this.currentScreen === 'venues') {
                this.renderVenuesScreen();
            } else if (this.currentScreen === 'betting') {
                this.renderBettingMachineScreen();
            } else if (this.currentScreen === 'betting-detail' && this.selectedTrackId) {
                const status = raceScheduler.getTrackStatus(this.selectedTrackId);
                const track = raceScheduler.getTrackData(this.selectedTrackId);
                this.dom.bettingDetailTitle.textContent = `${track.flagEmoji} ${track.name} - 第 ${status.raceNumber} 場 · ${this.formatTime(status.timeRemaining)} `;
            }

            if (this.selectedTrackId && this.dom.raceModal?.classList.contains('show')) {
                const status = raceScheduler.getTrackStatus(this.selectedTrackId);
                document.getElementById('race-modal-timer').textContent = this.formatTime(status.timeRemaining);
                document.getElementById('race-modal-status').textContent = status.message;

                if (status.phase === 'RACING' && !this.raceEngine) {
                    this.startRaceViewing(this.selectedTrackId);
                }
            }
        }, 1000);
    }

    // ====================================
    // Persistence
    // ====================================

    loadBalance() {
        const saved = localStorage.getItem('playerBalance');
        if (saved) this.balance = parseInt(saved);
    }

    saveBalance() {
        localStorage.setItem('playerBalance', this.balance);
    }

    loadStats() {
        const saved = localStorage.getItem('playerStats');
        if (saved) {
            const stats = JSON.parse(saved);
            this.totalBet = stats.totalBet || 0;
            this.totalProfit = stats.totalProfit || 0;
            this.winCount = stats.winCount || 0;
            this.totalBets = stats.totalBets || 0;
        }
    }

    saveStats() {
        const stats = {
            totalBet: this.totalBet,
            totalProfit: this.totalProfit,
            winCount: this.winCount,
            totalBets: this.totalBets
        };
        localStorage.setItem('playerStats', JSON.stringify(stats));
    }

    // ====================================
    // Utilities
    // ====================================

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} `;
    }
}

// Start game
const game = new HorseRacingGame();