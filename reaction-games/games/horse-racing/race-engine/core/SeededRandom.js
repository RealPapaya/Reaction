// ====================================
// Seeded Random Number Generator
// 確定性隨機數生成器，用於可重現的比賽模擬
// ====================================

/**
 * 基於種子碼的確定性隨機數生成器
 * 使用 Mulberry32 算法
 * 
 * 特性：
 * - 相同種子 → 相同隨機數序列
 * - 快速、高品質
 * - 適合遊戲使用
 * 
 * 使用範例：
 * const rng = new SeededRandom('my_seed_123');
 * const value = rng.next();        // 0.0 ~ 1.0
 * const num = rng.range(10, 20);   // 10.0 ~ 20.0
 * const int = rng.int(1, 6);       // 1, 2, 3, 4, 5, 或 6
 */
class SeededRandom {
    /**
     * @param {string|number} seed - 種子碼（字串或數字）
     */
    constructor(seed) {
        // 如果是字串，轉換為數字種子
        this.seed = typeof seed === 'string' ? this.hashString(seed) : seed;
    }

    /**
     * 將字串轉換為數字種子
     * @param {string} str - 輸入字串
     * @returns {number} 32位元整數種子
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 轉換為 32 位元整數
        }
        return hash;
    }

    /**
     * 生成下一個隨機數 (0.0 ~ 1.0)
     * 使用 Mulberry32 算法
     * @returns {number} 0.0 到 1.0 之間的隨機數
     */
    next() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    /**
     * 生成指定範圍的隨機數
     * @param {number} min - 最小值（包含）
     * @param {number} max - 最大值（不包含）
     * @returns {number} min 到 max 之間的隨機數
     */
    range(min, max) {
        return min + this.next() * (max - min);
    }

    /**
     * 生成指定範圍的隨機整數
     * @param {number} min - 最小值（包含）
     * @param {number} max - 最大值（包含）
     * @returns {number} min 到 max 之間的隨機整數
     */
    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    /**
     * 從陣列中隨機選擇一個元素
     * @param {Array} array - 輸入陣列
     * @returns {*} 隨機選擇的元素
     */
    choice(array) {
        if (array.length === 0) return undefined;
        return array[this.int(0, array.length - 1)];
    }

    /**
     * 隨機布林值
     * @param {number} probability - 返回 true 的機率 (0.0 ~ 1.0)
     * @returns {boolean}
     */
    boolean(probability = 0.5) {
        return this.next() < probability;
    }

    /**
     * 打亂陣列（Fisher-Yates shuffle）
     * @param {Array} array - 要打亂的陣列
     * @returns {Array} 打亂後的新陣列
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.int(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * 高斯分佈隨機數（Box-Muller transform）
     * @param {number} mean - 平均值
     * @param {number} stdDev - 標準差
     * @returns {number} 高斯分佈的隨機數
     */
    gaussian(mean = 0, stdDev = 1) {
        const u1 = this.next();
        const u2 = this.next();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stdDev + mean;
    }
}

// 如果在 Node.js 環境中，導出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SeededRandom;
}
