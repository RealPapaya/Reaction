// ====================================
// Redemption Machine
// Handles ticket scanning and prize redemption
// ====================================

class RedemptionMachine {
    constructor() {
        this.isScanning = false;
    }

    // ====================================
    // Ticket Scanning with Animation
    // ====================================

    async scanTicket(ticketId, onProgress) {
        if (this.isScanning) {
            throw new Error('正在處理其他投注單');
        }

        this.isScanning = true;

        try {
            // Step 1: Read ticket
            if (onProgress) onProgress('🔍 正在讀取投注單...', 0);
            await this.delay(500);

            const ticket = bettingMachine.getTicket(ticketId);
            if (!ticket) {
                throw new Error('投注單不存在');
            }

            if (ticket.status === 'redeemed') {
                throw new Error('此投注單已兌獎');
            }

            // Step 2: Connect to database
            if (onProgress) onProgress('📡 正在連線賽事資料庫...', 33);
            await this.delay(800);

            // Check if race has finished
            const trackStatus = raceScheduler.getTrackStatus(ticket.trackId);
            if (trackStatus.raceNumber === ticket.raceNumber) {
                if (trackStatus.phase === 'BETTING' || trackStatus.phase === 'RACING') {
                    throw new Error('比賽尚未結束');
                }
            }

            // Step 3: Verify results
            if (onProgress) onProgress('✅ 正在驗證結果...', 66);
            await this.delay(700);

            // 🆕 優先使用儲存的比賽結果
            let results = raceScheduler.getRaceResults(ticket.trackId, ticket.raceNumber);

            if (!results) {
                // 如果沒有儲存的結果（比賽還沒跑完或沒人觀看），用舊方法生成
                console.warn('⚠️ 找不到儲存的結果，使用種子生成（可能與視覺比賽不符）');
                const horses = raceScheduler.getOrGenerateHorses(ticket.trackId);
                results = raceResultGenerator.generateResults(horses, ticket.raceSeed);
            } else {
                console.log('✅ 使用儲存的比賽結果');
            }

            const winner = results[0];

            // Check if won
            const isWinner = winner.horse.id === ticket.horseId;
            const payout = isWinner ? ticket.potentialWin : 0;

            // Update ticket status
            ticket.status = 'redeemed';
            ticket.result = {
                isWinner: isWinner,
                payout: payout,
                results: results.slice(0, 3), // Top 3
                redeemedAt: Date.now()
            };
            bettingMachine.saveTickets();

            // Complete
            if (onProgress) onProgress('✅ 驗證完成', 100);
            await this.delay(300);

            this.isScanning = false;
            return ticket;

        } catch (error) {
            this.isScanning = false;
            throw error;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ====================================
    // Result Rendering
    // ====================================

    renderRedemptionResult(ticket) {
        const result = ticket.result;
        const redeemedTime = new Date(result.redeemedAt).toLocaleString('zh-TW', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        const resultClass = result.isWinner ? 'redemption-win' : 'redemption-lose';
        const statusIcon = result.isWinner ? '🎉' : '😔';
        const statusMessage = result.isWinner ? '恭喜中獎！' : '很遺憾，未中獎';

        const top3HTML = result.results.map((r, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            const isYourHorse = r.horse.id === ticket.horseId;
            const highlight = isYourHorse ? 'your-horse' : '';

            return `
                <div class="result-row ${highlight}">
                    <span class="medal">${medals[index]}</span>
                    <span class="horse-info">${r.horse.id}號 - ${r.horse.name}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="redemption-result ${resultClass}">
                <div class="result-header">
                    =============================
                    <div class="result-title">🎰 兌獎結果</div>
                    =============================
                </div>
                <div class="result-body">
                    <div class="result-row">
                        <span class="result-label">投注單號:</span>
                        <span class="result-value">${ticket.ticketId}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">場地:</span>
                        <span class="result-value">${ticket.trackFlag} ${ticket.trackName} - 第 ${ticket.raceNumber} 場</span>
                    </div>
                    <div class="result-divider">-----------------------------</div>
                    <div class="result-section">
                        <div class="section-title">比賽結果:</div>
                        ${top3HTML}
                    </div>
                    <div class="result-divider">-----------------------------</div>
                    <div class="result-row">
                        <span class="result-label">您的投注:</span>
                        <span class="result-value">${ticket.horseId}號 - ${ticket.horseName}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">投注金額:</span>
                        <span class="result-value">$${ticket.amount.toLocaleString()}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">賠率:</span>
                        <span class="result-value">${ticket.odds}x</span>
                    </div>
                    <div class="result-divider">-----------------------------</div>
                    <div class="result-status">
                        <div class="status-icon">${statusIcon}</div>
                        <div class="status-message">${statusMessage}</div>
                    </div>
                    ${result.isWinner ? `
                        <div class="payout-section">
                            <div class="payout-label">獲利金額:</div>
                            <div class="payout-amount">+$${result.payout.toLocaleString()}</div>
                            <div class="payout-total">總計: $${result.payout.toLocaleString()}</div>
                        </div>
                    ` : `
                        <div class="loss-message">期待下次幸運降臨</div>
                    `}
                    <div class="result-divider">-----------------------------</div>
                    <div class="result-row small">
                        <span class="result-label">兌獎時間:</span>
                        <span class="result-value">${redeemedTime}</span>
                    </div>
                </div>
                <div class="result-footer">
                    =============================
                    <div class="result-notice">感謝您的參與</div>
                    =============================
                </div>
            </div>
        `;
    }

    // Get all pending tickets that can be redeemed
    getRedeemableTickets() {
        return bettingMachine.getPendingTickets();
    }

    // Get redemption history
    getRedemptionHistory() {
        return bettingMachine.getRedeemedTickets();
    }
}

// Create global instance
const redemptionMachine = new RedemptionMachine();
