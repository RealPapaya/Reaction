// ====================================
// Shop Manager - 商店管理系統
// ====================================

class ShopManager {
    constructor() {
        this.purchasedReports = this.loadPurchasedReports();
    }

    // ====================================
    // Data Persistence
    // ====================================

    loadPurchasedReports() {
        const saved = localStorage.getItem('purchasedReports');
        return saved ? JSON.parse(saved) : {};
    }

    savePurchasedReports() {
        localStorage.setItem('purchasedReports', JSON.stringify(this.purchasedReports));
    }

    // ====================================
    // Purchase Logic
    // ====================================

    purchaseRacingForm(trackId, raceNumber, balance, price = 50) {
        const key = `${trackId}_${raceNumber}`;

        // 檢查是否已購買
        if (this.isPurchased(trackId, raceNumber)) {
            return { success: false, message: '已購買過此馬報' };
        }

        // 檢查餘額
        if (balance < price) {
            return { success: false, message: '餘額不足' };
        }

        // 記錄購買
        this.purchasedReports[key] = {
            type: 'racing_form',
            purchasedAt: Date.now(),
            price: price
        };

        this.savePurchasedReports();
        return { success: true, message: '購買成功', newBalance: balance - price };
    }

    isPurchased(trackId, raceNumber) {
        const key = `${trackId}_${raceNumber}`;
        return !!this.purchasedReports[key];
    }

    // ====================================
    // Data Extraction
    // ====================================

    getRacingFormData(horses) {
        return horses.map(horse => ({
            id: horse.id,
            name: horse.name,
            runningStyle: horse.runningStyle,
            gateNumber: horse.gateNumber,
            paddockObservation: horse.paddockObservation
        }));
    }

    // ====================================
    // Cleanup - 清除已過期的購買記錄
    // ====================================

    cleanupExpiredReports() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        Object.keys(this.purchasedReports).forEach(key => {
            const report = this.purchasedReports[key];
            if (now - report.purchasedAt > oneDay) {
                delete this.purchasedReports[key];
            }
        });

        this.savePurchasedReports();
    }
}

// Create global instance
const shopManager = new ShopManager();
