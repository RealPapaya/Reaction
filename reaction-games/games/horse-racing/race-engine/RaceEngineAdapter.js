// ====================================
// Race Engine Adapter
// 將 RaceSimulator 物理引擎適配到遊戲主程式
// ====================================

import { RaceSimulator } from './RaceSimulator.js';

class RaceEngineAdapter {
    constructor() {
        this.simulator = null;
        this.trackPath = null;
        this.gameHorses = null; // 保留原始遊戲資料
        this.isRunning = false;
    }

    // ====================================
    // 主要 API（與舊 race-engine.js 相容）
    // ====================================

    /**
     * 開始比賽
     * @param {Array} gameHorses - 遊戲馬匹資料
     * @param {Object} trackData - 賽道資料（來自 racetracks.js）
     */
    startRace(gameHorses, trackData) {
        this.gameHorses = gameHorses;

        // 1. 轉換賽道格式
        this.trackPath = this.convertTrackToPath(trackData);

        // 2. 轉換馬匹格式
        const simulatorHorses = this.convertHorsesToSimulatorFormat(gameHorses);

        // 3. 建立模擬器
        this.simulator = new RaceSimulator(simulatorHorses, this.trackPath);

        // 4. 開始模擬
        this.simulator.startRace();
        this.isRunning = true;
    }

    /**
     * 每幀更新
     */
    update() {
        if (!this.simulator || !this.isRunning) return;

        this.simulator.update();

        // 檢查是否結束
        if (!this.simulator.isRunning) {
            this.isRunning = false;
        }
    }

    /**
     * 獲取當前排行榜
     */
    getLeaderboard() {
        if (!this.simulator) return [];

        const leaderboard = this.simulator.getCurrentLeaderboard();

        // 轉換回遊戲格式
        return leaderboard.map(entry => ({
            horseId: entry.horse.id,
            horseName: entry.horse.name,
            position: entry.position,
            distance: entry.distance,
            isBoxedIn: entry.isBoxedIn,
            isOvertaking: entry.isOvertaking
        }));
    }

    /**
     * 獲取最終結果
     */
    getResults() {
        if (!this.simulator) return [];

        const results = this.simulator.getResults();

        // 轉換回遊戲格式（保留原有賠率等資訊）
        return results.map(result => {
            const gameHorse = this.gameHorses.find(h => h.id === result.horse.id);
            return {
                horseId: result.horse.id,
                horseName: result.horse.name,
                rank: result.position,
                finishTime: result.finishTime,
                odds: gameHorse?.odds || 0,
                ...gameHorse // 保留所有原始資料
            };
        });
    }

    /**
     * 獲取渲染資料（馬匹世界座標）
     */
    getRenderData() {
        if (!this.simulator) return { horses: [], trackPath: [] };

        const positions = this.simulator.getHorseWorldPositions();

        return {
            horses: positions,
            trackPath: this.trackPath,
            leaderboard: this.getLeaderboard()
        };
    }

    /**
     * 檢查是否結束
     */
    isFinished() {
        return !this.isRunning;
    }

    /**
     * 停止比賽
     */
    stopRace() {
        if (this.simulator) {
            this.simulator.stopRace();
        }
        this.isRunning = false;
    }

    // ====================================
    // 資料格式轉換
    // ====================================

    /**
     * 轉換賽道資料為 Frenet 路徑
     */
    convertTrackToPath(trackData) {
        // trackData 來自 racetracks.js，包含 pathPoints (normalized 0-1)
        const pathPoints = trackData.pathPoints || [];

        // 縮放到實際物理尺寸（米）
        const TRACK_SCALE = 500; // 500 米的賽道

        return pathPoints.map(point => ({
            x: (point.x - 0.5) * TRACK_SCALE, // 中心化
            y: (point.y - 0.5) * TRACK_SCALE
        }));
    }

    /**
     * 轉換遊戲馬匹資料為模擬器格式
     */
    convertHorsesToSimulatorFormat(gameHorses) {
        return gameHorses.map(horse => {
            // 根據 form (0-100) 推斷屬性
            const form = horse.form || 50;
            const competitiveFactor = form;

            // 推斷腳質（根據 form 和隨機性）
            const runningStyle = this.inferRunningStyle(form);

            return {
                id: horse.id,
                name: horse.name,
                competitiveFactor: competitiveFactor,
                runningStyle: runningStyle,

                // 保留原始資料（用於結果回傳）
                originalData: horse
            };
        });
    }

    /**
     * 根據 form 推斷腳質
     */
    inferRunningStyle(form) {
        const rand = Math.random();

        if (form >= 80) {
            // 強馬：多為逃、前
            return rand < 0.4 ? '逃' : (rand < 0.8 ? '前' : '追');
        } else if (form >= 60) {
            // 中等馬：平均分布
            if (rand < 0.25) return '逃';
            if (rand < 0.5) return '前';
            if (rand < 0.75) return '追';
            return '殿';
        } else {
            // 弱馬：多為追、殿
            return rand < 0.3 ? '前' : (rand < 0.65 ? '追' : '殿');
        }
    }

    /**
     * 獲取除錯資訊
     */
    getDebugInfo(horseId) {
        if (!this.simulator) return null;
        return this.simulator.getDebugInfo(horseId);
    }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RaceEngineAdapter;
}

export { RaceEngineAdapter };
