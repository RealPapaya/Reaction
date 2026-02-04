// ====================================
// Betting Machine
// Handles ticket generation and storage
// ====================================

class BettingMachine {
    constructor() {
        this.tickets = this.loadTickets();
    }

    // ====================================
    // Ticket Management
    // ====================================

    loadTickets() {
        const saved = localStorage.getItem('bettingTickets');
        return saved ? JSON.parse(saved) : [];
    }

    saveTickets() {
        localStorage.setItem('bettingTickets', JSON.stringify(this.tickets));
    }

    // Generate new betting ticket
    createTicket(trackId, horseId, amount, odds) {
        const trackStatus = raceScheduler.getTrackStatus(trackId);
        const trackData = raceScheduler.getTrackData(trackId);
        const horses = raceScheduler.getOrGenerateHorses(trackId);
        const horse = horses.find(h => h.id === horseId);

        if (!horse) {
            throw new Error('馬匹不存在');
        }

        if (trackStatus.phase !== 'BETTING') {
            throw new Error(`無法下注：${trackStatus.message}`);
        }

        const timestamp = Date.now();
        const ticketId = this.generateTicketId(timestamp);

        const ticket = {
            ticketId: ticketId,
            trackId: trackId,
            trackName: trackData.name,
            trackFlag: trackData.flagEmoji,
            raceNumber: trackStatus.raceNumber,
            raceSeed: trackStatus.raceSeed,
            horseId: horseId,
            horseName: horse.name,
            amount: amount,
            odds: odds,
            potentialWin: amount * odds,
            timestamp: timestamp,
            raceStartTime: trackStatus.raceNumber, // Will be calculated
            status: 'pending', // pending, finished, redeemed
            result: null // Will be filled when race finishes
        };

        this.tickets.push(ticket);
        this.saveTickets();

        return ticket;
    }

    generateTicketId(timestamp) {
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        const timeStr = new Date(timestamp).toISOString().substring(11, 16).replace(':', '');
        return `#${timeStr}-${random}`;
    }

    // Get all tickets
    getAllTickets() {
        return this.tickets;
    }

    // Get pending tickets (未兌獎)
    getPendingTickets() {
        return this.tickets.filter(ticket => {
            const trackStatus = raceScheduler.getTrackStatus(ticket.trackId);
            // Only show tickets where race has finished
            return ticket.status === 'pending' &&
                (trackStatus.phase === 'POST_RACE' || trackStatus.phase === 'CLOSED') &&
                trackStatus.raceNumber > ticket.raceNumber;
        });
    }

    // Get active tickets (當前場次)
    getActiveTickets() {
        return this.tickets.filter(ticket => {
            const trackStatus = raceScheduler.getTrackStatus(ticket.trackId);
            return ticket.status === 'pending' && trackStatus.raceNumber === ticket.raceNumber;
        });
    }

    // Get redeemed tickets
    getRedeemedTickets() {
        return this.tickets.filter(t => t.status === 'redeemed');
    }

    // Get ticket by ID
    getTicket(ticketId) {
        return this.tickets.find(t => t.ticketId === ticketId);
    }

    // ====================================
    // Ticket Rendering
    // ====================================

    renderTicketHTML(ticket) {
        const betTime = new Date(ticket.timestamp).toLocaleString('zh-TW', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="betting-ticket" data-ticket-id="${ticket.ticketId}">
                <div class="ticket-header">
                    =============================
                    <div class="ticket-title">🏇 賽馬投注單</div>
                    =============================
                </div>
                <div class="ticket-body">
                    <div class="ticket-row">
                        <span class="ticket-label">投注單號:</span>
                        <span class="ticket-value">${ticket.ticketId}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">場地:</span>
                        <span class="ticket-value">${ticket.trackFlag} ${ticket.trackName}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">比賽場次:</span>
                        <span class="ticket-value">第 ${ticket.raceNumber} 場</span>
                    </div>
                    <div class="ticket-row small">
                        <span class="ticket-label">比賽種子:</span>
                        <span class="ticket-value">${ticket.raceSeed}</span>
                    </div>
                    <div class="ticket-divider">-----------------------------</div>
                    <div class="ticket-row highlight">
                        <span class="ticket-label">投注馬匹:</span>
                        <span class="ticket-value">${ticket.horseId}號 - ${ticket.horseName}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">投注金額:</span>
                        <span class="ticket-value">$${ticket.amount.toLocaleString()}</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">當前賠率:</span>
                        <span class="ticket-value">${ticket.odds}x</span>
                    </div>
                    <div class="ticket-row">
                        <span class="ticket-label">預期獲利:</span>
                        <span class="ticket-value">$${ticket.potentialWin.toLocaleString()}</span>
                    </div>
                    <div class="ticket-divider">-----------------------------</div>
                    <div class="ticket-row small">
                        <span class="ticket-label">投注時間:</span>
                        <span class="ticket-value">${betTime}</span>
                    </div>
                </div>
                <div class="ticket-footer">
                    <div class="qr-code">
                        <div class="qr-placeholder">
                            ▓▓░░▓▓▓▓░░▓▓
                            ░░▓▓░░▓▓▓▓░░
                            ▓▓░░▓▓░░▓▓▓▓
                            ░░▓▓▓▓░░▓▓░░
                        </div>
                    </div>
                    =============================
                    <div class="ticket-notice">請於比賽結束後前往兌獎機</div>
                    =============================
                </div>
            </div>
        `;
    }
}

// Create global instance
const bettingMachine = new BettingMachine();
