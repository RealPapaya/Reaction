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
        this.deltaTimeout = null;

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
        this.dom.successModal = document.getElementById('success-modal');
        this.dom.trackInfoModal = document.getElementById('track-info-modal');
        this.dom.scanningOverlay = document.getElementById('scanning-overlay');
        this.dom.scanningMessage = document.getElementById('scanning-message');
        this.dom.scanningProgressBar = document.getElementById('scanning-progress-bar');

        // Shop
        this.dom.navBalance = document.getElementById('nav-balance');
        this.dom.coinBalance = document.getElementById('coin-balance');
        this.dom.coinDelta = document.getElementById('coin-delta');
        this.dom.coinDisplay = document.querySelector('.coin-display');
        this.dom.racingFormList = document.getElementById('racing-form-list');

        // Racing Form - Header Indicator
        this.dom.newspaperIndicator = document.getElementById('newspaper-indicator');
        this.dom.newspaperTooltip = document.getElementById('newspaper-tooltip');

        // Racing Form - Modal
        this.dom.racingFormModal = document.getElementById('racing-form-modal');
        this.dom.racingFormModalBody = document.getElementById('racing-form-modal-body');

        // Racing Form - Table
        this.dom.racingFormTableContainer = document.getElementById('racing-form-table-container');
        this.dom.formToggle = document.getElementById('form-toggle');
        this.dom.formContent = document.getElementById('form-content');
        this.dom.formTableBody = document.getElementById('form-table-body');
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
                // 🆕 Generic close for all modals
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('show');
                    modal.classList.remove('fullscreen');
                });

                // Restore navigation bar
                if (this.dom.navContainer) {
                    this.dom.navContainer.style.display = 'flex';
                }

                // Restore global back button
                if (this.dom.globalBackBtn) {
                    this.dom.globalBackBtn.style.display = 'block';
                }

                this.setCoinDisplayVisible(true);
            });
        });

        // Go to my bets button
        document.getElementById('go-to-my-bets')?.addEventListener('click', () => {
            this.dom.successModal.classList.remove('show');
            this.switchScreen('my-bets');
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

        // Fullscreen close button
        document.getElementById('fullscreen-close')?.addEventListener('click', () => {
            this.dom.raceModal?.classList.remove('show');
            this.dom.raceModal?.classList.remove('fullscreen');

            // Restore UI
            if (this.dom.navContainer) this.dom.navContainer.style.display = 'flex';
            if (this.dom.globalBackBtn) this.dom.globalBackBtn.style.display = 'block';
            this.setCoinDisplayVisible(true);

            if (this.raceEngine) {
                this.raceEngine.stopRace();
                this.raceEngine = null;
            }
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
        } else if (screenName === 'shop') {
            this.renderShopScreen();
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
                        <button class="btn btn-secondary track-info-btn" 
                                data-track-id="${status.trackId}">
                            場地介紹
                        </button>
                        <button class="btn btn-secondary track-history-btn" 
                                data-track-id="${status.trackId}">
                            歷史紀錄
                        </button>
                        <button class="btn btn-secondary track-schedule-btn" 
                                data-track-id="${status.trackId}">
                            賽程表
                        </button>
                        <button class="btn ${btnClass} track-view-btn" 
                                data-track-id="${status.trackId}"
                                ${btnDisabled}>
                            ${canView ? '觀看比賽' : '無法觀看'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for track info
        this.dom.venuesCardsContainer.querySelectorAll('.track-info-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showTrackInfo(btn.dataset.trackId);
            });
        });

        // 🆕 Add event listeners for track history
        this.dom.venuesCardsContainer.querySelectorAll('.track-history-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showTrackHistory(btn.dataset.trackId);
            });
        });

        // 🆕 Add event listeners for track schedule
        this.dom.venuesCardsContainer.querySelectorAll('.track-schedule-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showTrackSchedule(btn.dataset.trackId);
            });
        });

        // Add event listeners only to enabled buttons
        this.dom.venuesCardsContainer.querySelectorAll('.track-view-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                this.viewRace(btn.dataset.trackId);
            });
        });
    }

    showTrackInfo(trackId) {
        const track = raceScheduler.getTrackData(trackId);
        if (!track) return;

        document.getElementById('track-info-name').textContent = `${track.flagEmoji} ${track.name} (${track.nameEn})`;

        // Handle image
        const img = document.getElementById('track-info-image');
        if (track.image) {
            img.src = track.image;
            img.classList.remove('hidden');
        } else {
            img.src = '';
            img.classList.add('hidden');
        }

        document.getElementById('track-info-description').textContent = track.description;
        document.getElementById('track-info-difficulty').textContent = track.difficultyLevel;
        document.getElementById('track-info-geology').textContent = track.geologyType;
        document.getElementById('track-info-characteristics').textContent = track.characteristicsDetail;

        const impactList = document.getElementById('track-info-impact-list');
        impactList.innerHTML = track.coreImpact.map(impact => `<li>${impact}</li>`).join('');

        this.dom.trackInfoModal.classList.add('show');
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

        // Calculate odds - 賠率與實力脫鉤系統
        // 賠率基於：歷史評分 + 走勢 + 騎手名氣 + 檔位，而非當日狀態

        // 計算每匹馬的賠率評分（用於生成賠率，與實際比賽結果無關）
        const calculateOddsRating = (horse) => {
            // 綜合評分 40%
            const ratingScore = horse.competitiveFactor * 0.40;

            // 近五場走勢 25%
            const formScore = (horse.trendScore / 10) * 0.25;

            // 騎手名氣 15%（騎手經驗越高，人氣越高）
            const jockeyScore = (horse.jockey.experience / 20) * 0.15;

            // 檔位 10%（1-4檔視為有利）
            const gateScore = (horse.gateNumber <= 4 ? 0.10 : 0.05);

            // 路程適性 10%（簡化為隨機）
            const distanceScore = Math.random() * 0.10;

            return ratingScore + formScore + jockeyScore + gateScore + distanceScore;
        };

        const totalOddsRating = horses.reduce((sum, h) => sum + calculateOddsRating(h), 0);

        horses.forEach(horse => {
            // Store previous odds for change indicator
            horse.previousOdds = horse.odds || 0;

            const oddsRating = calculateOddsRating(horse);
            const impliedProbability = oddsRating / totalOddsRating;

            const bookmakerMargin = 0.85; // 莊家返還率85%
            const rawOdds = (1 / impliedProbability) * bookmakerMargin;

            // 限制賠率範圍：1.5-25倍
            const clampedOdds = Math.max(1.5, Math.min(25, rawOdds));
            horse.odds = parseFloat(clampedOdds.toFixed(2));
        });

        this.dom.bettingDetailTitle.textContent = `${track.flagEmoji} ${track.name} - 第 ${status.raceNumber} 場 · ${this.formatTime(status.timeRemaining)} `;

        // 更新馬報顯示
        this.updateRacingFormDisplay(trackId, status.raceNumber);

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
                    <div class="cell-weight">${horse.weightCarried}kg</div>
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

        // Use betting machine methods to categorize tickets
        const active = bettingMachine.getActiveTickets();
        const pending = bettingMachine.getPendingTickets();
        const redeemed = redemptionMachine.getRedemptionHistory();

        // Active tickets (current race)
        this.dom.activeCount.textContent = active.length;
        if (active.length === 0) {
            this.dom.activeTickets.innerHTML = '<p class="no-tickets">暫無進行中的投注</p>';
        } else {
            this.dom.activeTickets.innerHTML = active.map(ticket => this.renderTicketCard(ticket)).join('');
        }

        // Redeemable tickets (race finished, not redeemed yet)
        this.dom.redeemableCount.textContent = pending.length;
        if (pending.length === 0) {
            this.dom.redeemableTickets.innerHTML = '<p class="no-tickets">暫無可兌獎的投注單</p>';
        } else {
            this.dom.redeemableTickets.innerHTML = pending.map(ticket => this.renderTicketCard(ticket, true)).join('');
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
        // Use betting machine's realistic ticket rendering
        const ticketHTML = bettingMachine.renderTicketHTML(ticket);

        // If we need a redeem button, wrap it with additional controls
        if (showRedeemBtn) {
            return `
                <div class="ticket-wrapper">
                    ${ticketHTML}
                    <div class="ticket-redeem-actions">
                        <button class="btn btn-primary redeem-btn" data-ticket-id="${ticket.ticketId}">
                            🎁 立即兌獎
                        </button>
                    </div>
                </div>
            `;
        }

        return ticketHTML;
    }

    renderHistoryCard(record) {
        const resultClass = record.result.isWinner ? 'win' : 'loss';
        const resultText = record.result.isWinner ? '✅ 中獎' : '❌ 未中獎';

        return `
            <div class="history-card ${resultClass}">
                <div class="history-header">
                    <span class="history-id">#{record.ticketId}</span>
                    <span class="history-result">${resultText}</span>
                </div>
                <div class="history-body">
                    <p>${record.trackName} - 第 ${record.raceNumber} 場</p>
                    <p>投注: ${record.horseId}號 · $${record.amount.toLocaleString()}</p>
                    ${record.result.isWinner ? `<p class="win-amount">獲利: $${record.result.payout.toLocaleString()}</p>` : ''}
                </div>
            </div>
        `;
    }

    async redeemTicket(ticketId) {
        // Reset Scanning UI Structure
        this.dom.scanningOverlay.innerHTML = `
            <div class="scanning-content">
                <div class="scanning-message" id="scanning-message">正在掃描...</div>
                <div class="scanning-progress">
                    <div class="scanning-progress-bar" id="scanning-progress-bar" style="width: 0%"></div>
                </div>
            </div>
        `;
        this.dom.scanningOverlay.classList.remove('hidden');

        // Re-cache temporary elements
        const messageEl = this.dom.scanningOverlay.querySelector('#scanning-message');
        const progressBarEl = this.dom.scanningOverlay.querySelector('#scanning-progress-bar');

        try {
            // Use correct API with progress callback
            const ticket = await redemptionMachine.scanTicket(ticketId, (msg, progress) => {
                if (messageEl) messageEl.textContent = msg;
                if (progressBarEl) progressBarEl.style.width = `${progress}%`;
            });

            // Handle Success
            if (ticket.result.isWinner) {
                this.balance += ticket.result.payout;
                this.winCount++;
                this.totalProfit += (ticket.result.payout - ticket.amount);
            } else {
                this.totalProfit -= ticket.amount;
            }
            this.totalBets++;

            this.saveBalance();
            this.saveStats();
            this.updateBalanceDisplay();
            if (ticket.result.isWinner) {
                this.showBalanceDelta(ticket.result.payout);
            }

            // Render Result (Custom Theme Modal)
            const resultHTML = redemptionMachine.renderRedemptionResult(ticket);
            this.dom.scanningOverlay.innerHTML = `
                <div class="scanning-content result-mode" style="max-width: 400px; padding: 0;">
                    ${resultHTML}
                    <div style="padding: 15px;">
                        <button class="btn btn-primary close-overlay-btn" style="width: 100%;">確 定</button>
                    </div>
                </div>
            `;

            // Bind Close Event
            this.dom.scanningOverlay.querySelector('.close-overlay-btn').addEventListener('click', () => {
                this.dom.scanningOverlay.classList.add('hidden');
                this.renderMyBetsScreen();
            });

        } catch (error) {
            // Handle Error (Custom Theme Modal)
            this.dom.scanningOverlay.innerHTML = `
                <div class="scanning-content error-mode" style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #ff4d4d;">兌獎失敗</div>
                    <div style="margin-bottom: 20px; color: #666;">${error.message}</div>
                    <button class="btn btn-primary close-overlay-btn" style="width: 100%;">關 閉</button>
                </div>
            `;

            // Bind Close Event
            this.dom.scanningOverlay.querySelector('.close-overlay-btn').addEventListener('click', () => {
                this.dom.scanningOverlay.classList.add('hidden');
            });
        }
    }


    // ====================================
    // Race Viewing with Fullscreen
    // ====================================

    viewRace(trackId) {
        this.selectedTrackId = trackId;
        const status = raceScheduler.getTrackStatus(trackId);
        const track = raceScheduler.getTrackData(trackId);

        document.getElementById('race-modal-timer').textContent = this.formatTime(status.timeRemaining);

        // Apply fullscreen immersion
        this.dom.raceModal.classList.add('fullscreen');
        this.dom.raceModal.classList.add('show');

        // Hide navigation bar for full immersion
        if (this.dom.navContainer) {
            this.dom.navContainer.style.display = 'none';
        }

        // Hide global back button for full immersion
        if (this.dom.globalBackBtn) {
            this.dom.globalBackBtn.style.display = 'none';
        }

        this.setCoinDisplayVisible(false);

        if (status.phase === 'RACING') {
            this.startRaceViewing(trackId);
        } else if (status.phase === 'PRE_RACE') {
            // 🎯 只有準備比賽的 15 秒才秀賽馬畫面
            document.getElementById('race-waiting').style.display = 'none';
            document.getElementById('race-canvas').style.display = 'block';
            this.startRacePreparation(trackId, status.timeRemaining);
            // 投注階段或其他階段，秀等待畫面，隱藏畫布
            const waitingDiv = document.getElementById('race-waiting');
            if (waitingDiv) {
                waitingDiv.style.display = 'block';
                // 更新文字：如果是 POST_RACE，顯示比賽已結束
                if (status.phase === 'POST_RACE') {
                    waitingDiv.innerHTML = '<p>🏁 比賽已結束</p>';
                } else if (status.phase === 'CLOSED') {
                    waitingDiv.innerHTML = '<p>⏳ 等待下一場</p>';
                } else {
                    waitingDiv.innerHTML = '<p>⏳ 比賽尚未開始</p>';
                }
            }
            document.getElementById('race-canvas').style.display = 'none';
            if (this.raceEngine) {
                this.raceEngine.stopRace();
                this.raceEngine = null;
            }
        }
    }

    /**
     * 🎯 啟動比賽準備畫面
     */
    startRacePreparation(trackId, timeRemaining) {
        const canvas = document.getElementById('race-canvas');
        const waitingScreen = document.getElementById('race-waiting');
        const horses = raceScheduler.getOrGenerateHorses(trackId);
        const track = raceScheduler.getTrackData(trackId);

        // 確保 UI 顯示正確
        if (waitingScreen) waitingScreen.style.display = 'none';
        if (canvas) canvas.style.display = 'block';

        if (!this.raceEngine || this.raceEngine.isPreparing === false) {
            if (this.raceEngine) this.raceEngine.stopRace();
            this.raceEngine = new RaceEngineAdapter(canvas, horses, track);
            this.raceEngine.startPreparation(horses, track);
        }

        // 更新倒數文字
        if (this.raceEngine) {
            this.raceEngine.countdownText = this.formatTime(timeRemaining);
        }
    }

    startRaceViewing(trackId) {
        const canvas = document.getElementById('race-canvas');
        const horses = raceScheduler.getOrGenerateHorses(trackId);
        const track = raceScheduler.getTrackData(trackId);

        document.getElementById('race-waiting').style.display = 'none';
        canvas.style.display = 'block';

        document.getElementById('race-waiting').style.display = 'none';
        canvas.style.display = 'block';

        // 🎯 計算經過時間 (用於中途加入)
        const raceStatus = raceScheduler.getTrackStatus(trackId);
        // raceDuration is 120s (2 min) in raceScheduler
        const elapsedSeconds = raceScheduler.raceDuration / 1000 - raceStatus.timeRemaining;
        // Make sure it's positive and logical
        const elapsedTimeMs = Math.max(0, elapsedSeconds * 1000);

        // 如果引擎已經在準備狀態，直接啟動即可
        if (this.raceEngine && this.raceEngine.isPreparing) {
            this.raceEngine.startRace(horses, track, elapsedTimeMs);
        } else {
            if (this.raceEngine) this.raceEngine.stopRace();
            this.raceEngine = new RaceEngineAdapter(canvas, horses, track);
            this.raceEngine.startRace(horses, track, elapsedTimeMs);
        }

        // 🆕 監聽比賽結束，儲存結果
        if (this.raceFinishCheckInterval) {
            clearInterval(this.raceFinishCheckInterval);
        }

        this.raceFinishCheckInterval = setInterval(() => {
            if (this.raceEngine && this.raceEngine.isFinished()) {
                const results = this.raceEngine.getResults();

                // 存儲比賽結果
                raceScheduler.saveRaceResults(trackId, results);

                // 🆕 存儲重播數據
                const replayData = this.raceEngine.getReplayData();
                if (replayData) {
                    const status = raceScheduler.getTrackStatus(trackId);
                    raceScheduler.saveReplayData(trackId, status.raceNumber, replayData);
                    console.log('📼 重播數據已存儲');
                }

                clearInterval(this.raceFinishCheckInterval);
                this.raceFinishCheckInterval = null;
                console.log('✅ 比賽結束，結果已儲存');
            }
        }, 1000);
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
            this.updateBalanceDisplay();
            this.showBalanceDelta(-this.currentBetAmount);

            this.dom.quickBetModal.classList.remove('show');

            // Show custom success modal
            document.getElementById('success-ticket-id').textContent = `投注單號: ${ticket.ticketId}`;
            this.dom.successModal.classList.add('show');

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
            } else if (this.currentScreen === 'shop') {
                this.renderShopScreen();
            } else if (this.currentScreen === 'betting-detail' && this.selectedTrackId) {
                const status = raceScheduler.getTrackStatus(this.selectedTrackId);
                const track = raceScheduler.getTrackData(this.selectedTrackId);
                this.dom.bettingDetailTitle.textContent = `${track.flagEmoji} ${track.name} - 第 ${status.raceNumber} 場 · ${this.formatTime(status.timeRemaining)} `;
            }

            if (this.selectedTrackId && this.dom.raceModal?.classList.contains('show')) {
                const status = raceScheduler.getTrackStatus(this.selectedTrackId);
                document.getElementById('race-modal-timer').textContent = this.formatTime(status.timeRemaining);
                document.getElementById('race-modal-status').textContent = status.message;

                if (status.phase === 'RACING') {
                    // 如果尚未啟動或還在準備模式，則切換為正式比賽
                    if (!this.raceEngine || this.raceEngine.isPreparing) {
                        this.startRaceViewing(this.selectedTrackId);
                    }
                } else if (status.phase === 'PRE_RACE') {
                    // 在 15 秒準備階段，更新中央大型倒數並顯示賽道
                    this.startRacePreparation(this.selectedTrackId, status.timeRemaining);
                } else {
                    // 在投注階段或賽後，確保顯示等待畫面並隱藏畫布
                    const waitingDiv = document.getElementById('race-waiting');
                    if (waitingDiv) {
                        waitingDiv.style.display = 'block';
                        if (status.phase === 'POST_RACE') {
                            waitingDiv.innerHTML = '<p>🏁 比賽已結束</p>';
                        } else if (status.phase === 'CLOSED') {
                            waitingDiv.innerHTML = '<p>⏳ 等待下一場</p>';
                        } else {
                            waitingDiv.innerHTML = '<p>⏳ 比賽尚未開始</p>';
                        }
                    }

                    document.getElementById('race-canvas').style.display = 'none';
                    if (this.raceEngine) {
                        this.raceEngine.stopRace();
                        this.raceEngine = null;
                    }
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
        this.updateBalanceDisplay();
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
    // Shop System
    // ====================================

    renderShopScreen() {
        const statuses = raceScheduler.getAllTrackStatuses();

        // 只顯示投注中的賽道
        const bettingTracks = statuses.filter(s => s.phase === 'BETTING');

        if (bettingTracks.length === 0) {
            this.dom.racingFormList.innerHTML = `
                <p class="no-products">目前沒有可購買的馬報</p>
            `;
            return;
        }

        this.dom.racingFormList.innerHTML = bettingTracks.map(status => {
            const track = raceScheduler.getTrackData(status.trackId);
            const isPurchased = shopManager.isPurchased(status.trackId, status.raceNumber);
            const cardClass = isPurchased ? 'product-card' : 'product-card unpurchased';

            return `
                <div class="${cardClass}">
                    <img src="../../assets/News Paper.webp" alt="馬報" class="product-newspaper-img">
                    <div class="product-info">
                        <h4>${track.flagEmoji} ${track.name} - 第 ${status.raceNumber} 場</h4>
                        <p class="product-status">
                            <span class="status-betting">投注中</span>
                            <span class="time-remaining">還剩 ${this.formatTime(status.timeRemaining)}</span>
                        </p>
                    </div>
                    <div class="product-action">
                        ${isPurchased ?
                    '<span class="purchased-badge">✅ 已購買</span>' :
                    `<button class="btn btn-primary buy-btn" data-track-id="${status.trackId}" data-race-number="${status.raceNumber}" data-price="50">購買 $50</button>`
                }
                    </div>
                </div>
            `;
        }).join('');

        // 綁定購買按鈕事件
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const trackId = e.target.dataset.trackId;
                const raceNumber = parseInt(e.target.dataset.raceNumber);
                const price = parseInt(e.target.dataset.price);
                this.purchaseRacingForm(trackId, raceNumber, price);
            });
        });
    }

    purchaseRacingForm(trackId, raceNumber, price) {
        const result = shopManager.purchaseRacingForm(trackId, raceNumber, this.balance, price);

        if (result.success) {
            // 扣款
            this.balance = result.newBalance;
            this.saveBalance();
            this.updateBalanceDisplay();
            this.showBalanceDelta(-price);

            // 重新渲染商店
            this.renderShopScreen();

            alert(`✅ ${result.message}！\n返回投注頁面查看馬報`);
        } else {
            alert(`❌ ${result.message}`);
        }
    }

    updateRacingFormDisplay(trackId, raceNumber) {
        const isPurchased = shopManager.isPurchased(trackId, raceNumber);

        // 更新 header 中的報紙指示器
        if (this.dom.newspaperIndicator) {
            if (isPurchased) {
                this.dom.newspaperIndicator.classList.remove('unpurchased');
                this.dom.newspaperIndicator.classList.add('purchased');
                if (this.dom.newspaperTooltip) {
                    this.dom.newspaperTooltip.textContent = '✅ 點擊查看馬報資訊';
                }
            } else {
                this.dom.newspaperIndicator.classList.remove('purchased');
                this.dom.newspaperIndicator.classList.add('unpurchased');
                if (this.dom.newspaperTooltip) {
                    this.dom.newspaperTooltip.textContent = '您沒有購買這場的馬報 於情報商店購買';
                }
            }

            // 點擊報紙圖示的行為
            this.dom.newspaperIndicator.onclick = () => {
                if (isPurchased) {
                    // 已購買：開啟馬報彈窗
                    const horses = raceScheduler.getOrGenerateHorses(trackId);
                    this.showRacingFormModal(horses);
                } else {
                    // 未購買：跳轉到商店
                    this.switchScreen('shop');
                }
            };
        }
    }

    showRacingFormModal(horses) {
        const formData = shopManager.getRacingFormData(horses);

        this.dom.racingFormModalBody.innerHTML = formData.map(horse => `
            <tr>
                <td>${horse.id}</td>
                <td>${horse.name}</td>
                <td><span class="running-style-badge">${horse.runningStyle}</span></td>
                <td>第${horse.gateNumber}檔</td>
                <td class="paddock-cell">${horse.paddockObservation}</td>
            </tr>
        `).join('');

        this.dom.racingFormModal.classList.add('show');
    }

    renderRacingFormTable(horses) {
        const formData = shopManager.getRacingFormData(horses);

        this.dom.formTableBody.innerHTML = formData.map(horse => `
            <tr>
                <td>${horse.id}</td>
                <td>${horse.name}</td>
                <td><span class="running-style-badge">${horse.runningStyle}</span></td>
                <td>第${horse.gateNumber}檔</td>
                <td class="paddock-cell">${horse.paddockObservation}</td>
            </tr>
        `).join('');
    }

    updateBalanceDisplay() {
        // 更新所有餘額顯示位置
        if (this.dom.balanceAmount) {
            this.dom.balanceAmount.textContent = `$${this.balance.toLocaleString()}`;
        }
        if (this.dom.navBalance) {
            this.dom.navBalance.textContent = this.balance.toLocaleString();
        }
        if (this.dom.coinBalance) {
            this.dom.coinBalance.textContent = this.balance.toLocaleString();
        }
    }

    showBalanceDelta(delta) {
        if (!this.dom.coinDelta || !delta) return;

        const sign = delta > 0 ? '+' : '';
        this.dom.coinDelta.textContent = `${sign}${delta.toLocaleString()}`;
        this.dom.coinDelta.classList.remove('positive', 'negative', 'show');
        this.dom.coinDelta.classList.add(delta > 0 ? 'positive' : 'negative');

        // Restart animation
        void this.dom.coinDelta.offsetWidth;
        this.dom.coinDelta.classList.add('show');

        if (this.deltaTimeout) {
            clearTimeout(this.deltaTimeout);
        }
        this.deltaTimeout = setTimeout(() => {
            this.dom.coinDelta.classList.remove('show');
        }, 1200);
    }

    setCoinDisplayVisible(isVisible) {
        if (!this.dom.coinDisplay) return;
        this.dom.coinDisplay.style.display = isVisible ? 'flex' : 'none';
    }

    // ====================================
    // Utilities
    // ====================================

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} `;
    }

    // ====================================
    // 🆕 Replay System
    // ====================================

    showReplayModal(trackId, raceNumber) {
        console.log(`📼 嘗試顯示重播: ${trackId} 第 ${raceNumber} 場`);

        const replayData = raceScheduler.getReplayData(trackId, raceNumber);

        if (!replayData || !replayData.trajectory || replayData.trajectory.length === 0) {
            alert('此場比賽沒有重播數據');
            return;
        }

        const track = raceScheduler.getTrackData(trackId);
        document.getElementById('replay-modal-title').textContent =
            `🎬 ${track.flagEmoji} ${track.name} - 第 ${raceNumber} 場重播`;

        const canvas = document.getElementById('replay-canvas');

        if (this.replayViewer) {
            this.replayViewer.destroy();
        }

        this.replayViewer = new RaceReplayViewer(canvas, replayData, track);

        this.replayViewer.onTimeUpdate = (currentTime, totalTime) => {
            const currentMin = Math.floor(currentTime / 60);
            const currentSec = Math.floor(currentTime % 60);
            const totalMin = Math.floor(totalTime / 60);
            const totalSec = Math.floor(totalTime % 60);
            const timeText = `${currentMin.toString().padStart(2, '0')}:${currentSec.toString().padStart(2, '0')} / ${totalMin.toString().padStart(2, '0')}:${totalSec.toString().padStart(2, '0')}`;
            document.getElementById('replay-time').textContent = timeText;
            const progress = (currentTime / totalTime) * 100;
            document.getElementById('replay-seek-bar').value = progress;
        };

        this.setupReplayControls();
        document.getElementById('replay-modal').classList.add('show');
        this.replayViewer.render();
    }

    setupReplayControls() {
        document.getElementById('replay-play-btn').onclick = () => {
            if (this.replayViewer) this.replayViewer.play();
        };

        document.getElementById('replay-pause-btn').onclick = () => {
            if (this.replayViewer) this.replayViewer.pause();
        };

        document.getElementById('replay-restart-btn').onclick = () => {
            if (this.replayViewer) this.replayViewer.stop();
        };

        document.getElementById('replay-speed').onchange = (e) => {
            if (this.replayViewer) {
                this.replayViewer.setSpeed(parseFloat(e.target.value));
            }
        };

        const seekBar = document.getElementById('replay-seek-bar');
        seekBar.oninput = (e) => {
            if (this.replayViewer) {
                const totalDuration = this.replayViewer.getTotalDuration();
                const targetTime = (e.target.value / 100) * totalDuration;
                this.replayViewer.seekTo(targetTime);
            }
        };
    }
}

// Start game
const game = new HorseRacingGame();
