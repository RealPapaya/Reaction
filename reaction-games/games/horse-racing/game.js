// ====================================
// Horse Racing Game - Multi-Track System
// Modular Architecture
// ====================================

// ====================================
// Track State Manager
// ====================================
class TrackStateManager {
    constructor() {
        this.tracks = new Map();
        this.initializeTracks();
    }

    initializeTracks() {
        RACETRACKS.forEach(trackData => {
            this.tracks.set(trackData.id, {
                data: trackData,
                timeRemaining: 300, // 5 minutes
                phase: 'BETTING', // BETTING, RACING, RESULTS
                horses: [],
                bets: [],
                raceNumber: 0,
                history: [],
                timerInterval: null,
                oddsInterval: null
            });
        });
    }

    getTrack(trackId) {
        return this.tracks.get(trackId);
    }

    getAllTracks() {
        return Array.from(this.tracks.values());
    }

    startTimer(trackId, onTick, onExpire) {
        const track = this.getTrack(trackId);
        if (!track) return;

        // Clear existing timer
        if (track.timerInterval) {
            clearInterval(track.timerInterval);
        }

        track.timerInterval = setInterval(() => {
            track.timeRemaining--;
            if (onTick) onTick(track.timeRemaining);

            if (track.timeRemaining <= 0) {
                this.stopTimer(trackId);
                if (onExpire) onExpire();
            }
        }, 1000);
    }

    stopTimer(trackId) {
        const track = this.getTrack(trackId);
        if (track && track.timerInterval) {
            clearInterval(track.timerInterval);
            track.timerInterval = null;
        }
    }

    resetTimer(trackId) {
        const track = this.getTrack(trackId);
        if (track) {
            this.stopTimer(trackId);
            track.timeRemaining = 300;
        }
    }
}

// ====================================
// Main Game Controller
// ====================================
class HorseRacingGame {
    constructor() {
        // Global state
        this.balance = 10000;
        this.trackManager = new TrackStateManager();
        this.currentTrackId = null;
        this.currentView = 'TRACK_SELECTION'; // TRACK_SELECTION, TRACK_DETAIL
        this.currentPanel = 'intro'; // intro, betting, race

        // Race engine
        this.raceEngine = null;

        // Betting
        this.currentBettingHorse = null;
        this.currentBetAmount = 0;

        // DOM elements - will be initialized
        this.dom = {};

        // Initialize
        this.init();
    }

    // ====================================
    // Initialization
    // ====================================

    init() {
        this.cacheDOMElements();
        this.setupEventListeners();
        this.renderTrackSelection();
        this.startAllTrackTimers();
    }

    cacheDOMElements() {
        // Global
        this.dom.globalBalance = document.getElementById('global-balance');
        this.dom.myBetsBtn = document.getElementById('my-bets-btn');

        // Track Selection
        this.dom.trackSelectionScreen = document.getElementById('track-selection-screen');
        this.dom.trackCardsContainer = document.getElementById('track-cards-container');

        // Track Detail
        this.dom.trackDetailScreen = document.getElementById('track-detail-screen');
        this.dom.backToSelectionBtn = document.getElementById('back-to-selection');
        this.dom.currentTrackName = document.getElementById('current-track-name');
        this.dom.currentTrackLocation = document.getElementById('current-track-location');
        this.dom.trackTimer = document.getElementById('track-timer');

        // Track Options
        this.dom.trackOptionBtns = document.querySelectorAll('.track-option-btn');

        // Panels
        this.dom.trackIntroPanel = document.getElementById('track-intro-panel');
        this.dom.trackBettingPanel = document.getElementById('track-betting-panel');
        this.dom.trackRacePanel = document.getElementById('track-race-panel');

        // Intro Panel Elements
        this.dom.introSurface = document.getElementById('intro-surface');
        this.dom.introSignature = document.getElementById('intro-signature');
        this.dom.introDifficulty = document.getElementById('intro-difficulty');
        this.dom.introDescription = document.getElementById('intro-description');

        // Betting Panel Elements
        this.dom.raceStatus = document.getElementById('race-status');
        this.dom.horsesContainer = document.getElementById('horses-container');
        this.dom.currentTrackBets = document.getElementById('current-track-bets');
        this.dom.currentTrackTotal = document.getElementById('current-track-total');

        // Race Panel Elements
        this.dom.raceCanvas = document.getElementById('race-canvas');
        this.dom.raceWaitingMessage = document.getElementById('race-waiting-message');

        // Modals
        this.dom.betModal = document.getElementById('bet-modal');
        this.dom.resultModal = document.getElementById('result-modal');
        this.dom.myBetsModal = document.getElementById('my-bets-modal');
    }

    setupEventListeners() {
        // My Bets button
        this.dom.myBetsBtn.addEventListener('click', () => this.openMyBetsModal());

        // Back to selection
        this.dom.backToSelectionBtn.addEventListener('click', () => this.showTrackSelection());

        // Track option tabs
        this.dom.trackOptionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const option = e.target.dataset.option;
                this.switchPanel(option);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.betModal.classList.remove('show');
                this.dom.resultModal.classList.remove('show');
                this.dom.myBetsModal.classList.remove('show');
            });
        });

        // Betting modal
        document.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                this.selectBetAmount(amount);
            });
        });

        document.getElementById('custom-amount').addEventListener('input', (e) => {
            const amount = parseInt(e.target.value) || 0;
            this.selectBetAmount(amount);
        });

        document.getElementById('confirm-bet-btn').addEventListener('click', () => {
            this.confirmBet();
        });
    }

    // ====================================
    // Track Selection View
    // ====================================

    renderTrackSelection() {
        this.dom.trackCardsContainer.innerHTML = '';

        this.trackManager.getAllTracks().forEach(track => {
            const card = this.createTrackCard(track);
            this.dom.trackCardsContainer.appendChild(card);
        });
    }

    createTrackCard(track) {
        const card = document.createElement('div');
        card.className = 'track-card';
        card.innerHTML = `
            <div class="track-card-header">
                <div class="track-card-title">
                    <span class="track-card-flag">${track.data.flagEmoji}</span>
                    <h3>${track.data.name}</h3>
                </div>
                <div class="track-card-timer" data-track-id="${track.data.id}">
                    ${this.formatTime(track.timeRemaining)}
                </div>
            </div>
            <div class="track-card-info">
                <div class="track-info-item">
                    <span class="track-info-label">地點</span>
                    <span class="track-info-value">${track.data.location}</span>
                </div>
                <div class="track-info-item">
                    <span class="track-info-label">賽道</span>
                    <span class="track-info-value">${track.data.surfaceDisplay}</span>
                </div>
                <div class="track-info-item">
                    <span class="track-info-label">狀態</span>
                    <span class="track-info-value">${this.getPhaseDisplay(track.phase)}</span>
                </div>
            </div>
            <p class="track-card-signature">🏆 ${track.data.signature}</p>
            <button class="btn btn-primary track-card-btn">進入賽場</button>
        `;

        card.querySelector('.track-card-btn').addEventListener('click', () => {
            this.selectTrack(track.data.id);
        });

        return card;
    }

    updateTrackCardTimers() {
        this.trackManager.getAllTracks().forEach(track => {
            const timerEl = document.querySelector(`[data-track-id="${track.data.id}"]`);
            if (timerEl) {
                timerEl.textContent = this.formatTime(track.timeRemaining);
            }
        });
    }

    // ====================================
    // Track Detail View
    // ====================================

    selectTrack(trackId) {
        this.currentTrackId = trackId;
        this.currentPanel = 'intro';
        this.showTrackDetail();
    }

    showTrackDetail() {
        const track = this.trackManager.getTrack(this.currentTrackId);
        if (!track) return;

        // Initialize horses if not already done
        if (track.horses.length === 0) {
            track.horses = generateHorses();
            this.calculateOdds(this.currentTrackId);
        }

        // Update header
        this.dom.currentTrackName.textContent = track.data.name;
        this.dom.currentTrackLocation.textContent = track.data.location;

        // Update intro panel
        this.dom.introSurface.textContent = track.data.surfaceDisplay;
        this.dom.introSignature.textContent = track.data.signature;
        this.dom.introDifficulty.textContent = track.data.characteristics.難度;
        this.dom.introDescription.textContent = track.data.description;

        // Switch to track detail view
        this.dom.trackSelectionScreen.classList.add('hidden');
        this.dom.trackDetailScreen.classList.remove('hidden');

        // Show intro panel by default
        this.switchPanel('intro');

        // Update timer display
        this.updateTrackTimer();
    }

    showTrackSelection() {
        this.currentTrackId = null;
        this.dom.trackDetailScreen.classList.add('hidden');
        this.dom.trackSelectionScreen.classList.remove('hidden');
        this.renderTrackSelection();
    }

    switchPanel(panelName) {
        this.currentPanel = panelName;

        // Update button states
        this.dom.trackOptionBtns.forEach(btn => {
            if (btn.dataset.option === panelName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update panel visibility
        this.dom.trackIntroPanel.classList.remove('active');
        this.dom.trackBettingPanel.classList.remove('active');
        this.dom.trackRacePanel.classList.remove('active');

        if (panelName === 'intro') {
            this.dom.trackIntroPanel.classList.add('active');
        } else if (panelName === 'betting') {
            this.dom.trackBettingPanel.classList.add('active');
            this.renderHorses();
            this.renderCurrentTrackBets();
        } else if (panelName === 'race') {
            this.dom.trackRacePanel.classList.add('active');
            this.showRaceView();
        }
    }

    // ====================================
    // Timer Management
    // ====================================

    startAllTrackTimers() {
        this.trackManager.getAllTracks().forEach(track => {
            this.trackManager.startTimer(
                track.data.id,
                () => {
                    // On tick
                    if (this.currentTrackId === track.data.id) {
                        this.updateTrackTimer();
                    }
                    this.updateTrackCardTimers();
                },
                () => {
                    // On expire
                    this.endBettingPhase(track.data.id);
                }
            );
        });
    }

    updateTrackTimer() {
        if (!this.currentTrackId) return;
        const track = this.trackManager.getTrack(this.currentTrackId);
        if (track) {
            this.dom.trackTimer.textContent = this.formatTime(track.timeRemaining);
            if (track.timeRemaining <= 30) {
                this.dom.trackTimer.classList.add('urgent');
            } else {
                this.dom.trackTimer.classList.remove('urgent');
            }
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    getPhaseDisplay(phase) {
        const displays = {
            'BETTING': '投注中',
            'RACING': '比賽中',
            'RESULTS': '結算中'
        };
        return displays[phase] || '準備中';
    }

    // ====================================
    // Odds Management
    // ====================================

    calculateOdds(trackId) {
        const track = this.trackManager.getTrack(trackId);
        if (!track) return;

        const totalPool = track.bets.reduce((sum, bet) => sum + bet.amount, 0) || 1;

        track.horses.forEach(horse => {
            const horseBets = track.bets
                .filter(bet => bet.horseId === horse.id)
                .reduce((sum, bet) => sum + bet.amount, 0);

            const baseOdds = 1 / horse.competitiveFactor;
            const betRatio = horseBets / totalPool;
            const poolAdjustment = 1 - (betRatio * 0.5);
            const randomFactor = randomFloat(0.95, 1.05);

            let finalOdds = baseOdds * poolAdjustment * randomFactor;
            finalOdds = Math.max(1.1, Math.min(50, finalOdds));

            horse.previousOdds = horse.odds;
            horse.odds = parseFloat(finalOdds.toFixed(2));
        });
    }

    updateOdds(trackId) {
        this.calculateOdds(trackId);
        if (this.currentTrackId === trackId && this.currentPanel === 'betting') {
            this.updateOddsValues();
        }
    }

    updateOddsValues() {
        const track = this.trackManager.getTrack(this.currentTrackId);
        if (!track) return;

        track.horses.forEach(horse => {
            const oddsCard = document.getElementById(`odds-card-${horse.id}`);
            const oddsElement = document.getElementById(`odds-val-${horse.id}`);
            const changeElement = document.getElementById(`odds-change-${horse.id}`);

            if (oddsCard && oddsElement && changeElement) {
                const currentText = parseFloat(oddsElement.textContent);
                if (currentText !== horse.odds) {
                    oddsCard.classList.remove('flipping');
                    void oddsCard.offsetWidth;
                    oddsCard.classList.add('flipping');

                    setTimeout(() => {
                        oddsElement.textContent = horse.odds;

                        let oddsChangeHtml = '';
                        if (horse.previousOdds > 0) {
                            if (horse.odds > horse.previousOdds) {
                                oddsChangeHtml = '<span class="odds-change up">↑</span>';
                            } else if (horse.odds < horse.previousOdds) {
                                oddsChangeHtml = '<span class="odds-change down">↓</span>';
                            }
                        }
                        changeElement.innerHTML = oddsChangeHtml;
                    }, 300);
                }
            }
        });
    }

    // ====================================
    // Horse Rendering
    // ====================================

    renderHorses() {
        const track = this.trackManager.getTrack(this.currentTrackId);
        if (!track) return;

        this.dom.horsesContainer.innerHTML = '';

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
            </div>
            <div class="program-body">
                ${track.horses.map(horse => this.createHorseRow(horse, track)).join('')}
            </div>
        `;

        container.querySelectorAll('.bet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const horseId = parseInt(e.currentTarget.dataset.horseId);
                const horse = track.horses.find(h => h.id === horseId);
                this.openBetModal(horse);
            });
        });

        this.dom.horsesContainer.appendChild(container);
    }

    createHorseRow(horse, track) {
        let oddsChange = '';
        if (horse.previousOdds > 0) {
            if (horse.odds > horse.previousOdds) {
                oddsChange = '<span class="odds-change up">↑</span>';
            } else if (horse.odds < horse.previousOdds) {
                oddsChange = '<span class="odds-change down">↓</span>';
            }
        }

        const weightChangeText = horse.weightChange >= 0 ? `+${horse.weightChange}` : horse.weightChange;
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
                    <button class="btn btn-secondary bet-btn" data-horse-id="${horse.id}" ${track.phase !== 'BETTING' ? 'disabled' : ''}>
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

    renderCurrentTrackBets() {
        const track = this.trackManager.getTrack(this.currentTrackId);
        if (!track) return;

        if (track.bets.length === 0) {
            this.dom.currentTrackBets.innerHTML = '<p class="no-bets">尚未下注</p>';
            this.dom.currentTrackTotal.textContent = '$0';
            return;
        }

        const totalBet = track.bets.reduce((sum, bet) => sum + bet.amount, 0);

        this.dom.currentTrackBets.innerHTML = track.bets.map(bet => {
            const horse = track.horses.find(h => h.id === bet.horseId);
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

        this.dom.currentTrackTotal.textContent = `$${totalBet.toLocaleString()}`;
    }

    // ====================================
    // Betting Methods
    // ====================================

    openBetModal(horse) {
        const track = this.trackManager.getTrack(this.currentTrackId);
        if (!track || track.phase !== 'BETTING') return;

        this.currentBettingHorse = horse;
        this.currentBetAmount = 0;

        document.getElementById('modal-horse-name').textContent = `${horse.id}號 - ${horse.name}`;
        document.getElementById('modal-horse-details').textContent =
            `${horse.gender} ${horse.age}歲 ${horse.weight}kg ${horse.height}cm`;
        document.getElementById('modal-jockey-details').textContent =
            `騎手: ${horse.jockey.name} (${horse.jockey.weight}kg, ${horse.jockey.experience}年)`;
        document.getElementById('modal-odds').textContent = `${horse.odds}x`;

        document.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('custom-amount').value = '';
        this.updateBetPreview();

        this.dom.betModal.classList.add('show');
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

        const track = this.trackManager.getTrack(this.currentTrackId);
        if (!track) return;

        track.bets.push({
            horseId: this.currentBettingHorse.id,
            amount: this.currentBetAmount,
            odds: this.currentBettingHorse.odds
        });

        this.balance -= this.currentBetAmount;
        this.updateGlobalBalance();
        this.renderCurrentTrackBets();
        this.dom.betModal.classList.remove('show');

        this.calculateOdds(this.currentTrackId);
        this.updateOdds(this.currentTrackId);
    }

    updateGlobalBalance() {
        this.dom.globalBalance.textContent = `$${this.balance.toLocaleString()}`;
    }

    // ====================================
    // Race Management
    // ====================================

    showRaceView() {
        const track = this.trackManager.getTrack(this.currentTrackId);
        if (!track) return;

        if (track.phase === 'BETTING') {
            // Show waiting state
            this.dom.raceWaitingMessage.style.display = 'block';
        } else if (track.phase === 'RACING') {
            // Hide waiting message and show race
            this.dom.raceWaitingMessage.style.display = 'none';
            // Race is already running
        }
    }

    endBettingPhase(trackId) {
        const track = this.trackManager.getTrack(trackId);
        if (!track || track.phase !== 'BETTING') return;

        track.phase = 'RACING';

        if (this.currentTrackId === trackId) {
            this.dom.raceStatus.textContent = '比賽中';
            this.dom.raceStatus.classList.add('racing');

            if (this.currentPanel === 'race') {
                this.dom.raceWaitingMessage.style.display = 'none';
            }
        }

        // Disable bet buttons
        document.querySelectorAll('.bet-btn').forEach(btn => btn.disabled = true);

        // Start race after short delay
        setTimeout(() => this.startRace(trackId), 1000);
    }

    startRace(trackId) {
        const track = this.trackManager.getTrack(trackId);
        if (!track) return;

        // Only initialize race engine if on this track's race view
        if (this.currentTrackId === trackId && this.currentPanel === 'race') {
            this.raceEngine = new RaceEngine(this.dom.raceCanvas, track.horses, track.data);
            this.raceEngine.startRace();
        }

        // Race duration
        setTimeout(() => this.endRace(trackId), 32000);
    }

    endRace(trackId) {
        const track = this.trackManager.getTrack(trackId);
        if (!track) return;

        track.phase = 'RESULTS';

        // Get results (simulate if engine not running)
        let results;
        if (this.raceEngine && this.currentTrackId === trackId) {
            results = this.raceEngine.getResults();
        } else {
            // Simulate results based on competitive factors
            results = track.horses
                .sort((a, b) => b.competitiveFactor - a.competitiveFactor)
                .map((horse, index) => ({ horse, position: index + 1 }));
        }

        const winner = results[0].horse;
        const payout = this.calculatePayout(trackId, winner);
        const profit = payout - track.bets.reduce((sum, bet) => sum + bet.amount, 0);

        this.balance += payout;
        this.updateGlobalBalance();

        track.raceNumber++;
        track.history.push({
            raceNumber: track.raceNumber,
            trackName: track.data.name,
            winner: winner,
            profit: profit
        });

        if (this.currentTrackId === trackId) {
            this.showResultModal(winner, results, payout, profit);
        }

        // Reset for next race
        setTimeout(() => this.startNextRace(trackId), 10000);
    }

    calculatePayout(trackId, winner) {
        const track = this.trackManager.getTrack(trackId);
        if (!track) return 0;

        let totalPayout = 0;
        track.bets.forEach(bet => {
            if (bet.horseId === winner.id) {
                totalPayout += bet.amount * bet.odds;
            }
        });
        return totalPayout;
    }

    showResultModal(winner, results, payout, profit) {
        document.getElementById('winner-name').textContent = `${winner.id}號 - ${winner.name}`;

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
        this.dom.resultModal.classList.add('show');
    }

    startNextRace(trackId) {
        const track = this.trackManager.getTrack(trackId);
        if (!track) return;

        track.bets = [];
        track.phase = 'BETTING';
        this.trackManager.resetTimer(trackId);

        // Generate new horses
        track.horses = generateHorses();
        this.calculateOdds(trackId);

        // Restart timer
        this.trackManager.startTimer(
            trackId,
            () => {
                if (this.currentTrackId === trackId) {
                    this.updateTrackTimer();
                }
                this.updateTrackCardTimers();
            },
            () => this.endBettingPhase(trackId)
        );

        // Update UI if on this track
        if (this.currentTrackId === trackId) {
            this.dom.raceStatus.textContent = '投注中';
            this.dom.raceStatus.classList.remove('racing');
            if (this.currentPanel === 'betting') {
                this.renderHorses();
                this.renderCurrentTrackBets();
            } else if (this.currentPanel === 'race') {
                this.dom.raceWaitingMessage.style.display = 'block';
            }
        }
    }

    // ====================================
    // My Bets Modal
    // ====================================

    openMyBetsModal() {
        const allBetsList = document.getElementById('all-bets-list');
        allBetsList.innerHTML = '';

        let totalAllBets = 0;

        this.trackManager.getAllTracks().forEach(track => {
            if (track.bets.length > 0) {
                const trackGroup = document.createElement('div');
                trackGroup.className = 'track-bets-group';

                const betsHTML = track.bets.map(bet => {
                    const horse = track.horses.find(h => h.id === bet.horseId);
                    totalAllBets += bet.amount;
                    return `
                        <div class="bet-item">
                            <div>
                                <span class="bet-horse-name">${horse.id}號 ${horse.name}</span>
                            </div>
                            <div class="bet-amount">$${bet.amount}</div>
                        </div>
                    `;
                }).join('');

                trackGroup.innerHTML = `
                    <h4>${track.data.flagEmoji} ${track.data.name}</h4>
                    ${betsHTML}
                `;

                allBetsList.appendChild(trackGroup);
            }
        });

        if (totalAllBets === 0) {
            allBetsList.innerHTML = '<p class="no-bets">尚無投注</p>';
        }

        document.getElementById('total-all-bets').textContent = `$${totalAllBets.toLocaleString()}`;

        // Show history
        this.renderGlobalHistory();

        this.dom.myBetsModal.classList.add('show');
    }

    renderGlobalHistory() {
        const historyContainer = document.getElementById('global-history-container');
        const allHistory = [];

        this.trackManager.getAllTracks().forEach(track => {
            track.history.forEach(record => {
                allHistory.push({
                    ...record,
                    trackFlag: track.data.flagEmoji
                });
            });
        });

        if (allHistory.length === 0) {
            historyContainer.innerHTML = '<p class="no-history">暫無紀錄</p>';
            return;
        }

        allHistory.sort((a, b) => b.raceNumber - a.raceNumber);

        historyContainer.innerHTML = allHistory.slice(0, 20).map(record => {
            const resultClass = record.profit >= 0 ? 'win' : 'lose';
            const profitText = record.profit >= 0 ? `+$${record.profit}` : `-$${Math.abs(record.profit)}`;

            return `
                <div class="history-item">
                    <div class="history-race-number">${record.trackFlag} ${record.trackName} - 第 ${record.raceNumber} 場</div>
                    <div class="history-winner">🏆 ${record.winner.id}號 ${record.winner.name} (${record.winner.odds}x)</div>
                    <div class="history-result ${resultClass}">${profitText}</div>
                </div>
            `;
        }).join('');
    }
}

// ====================================
// Start Game
// ====================================

const game = new HorseRacingGame();
