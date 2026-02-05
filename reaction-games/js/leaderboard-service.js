/**
 * Shared Leaderboard Service
 * connecting to Google Apps Script
 */

class LeaderboardService {
    constructor() {
        // REPLACE THIS URL AFTER DEPLOYING YOUR GOOGLE APPS SCRIPT
        this.API_URL = 'https://script.google.com/macros/s/AKfycby6GjBUE0WZ5_ES7kxRc19sBTIMHWWC4aCxljuxp2gcoPxejd_4Xrg3AD97jlMOYmg5VQ/exec';
    }

    /**
     * Submit a score to the leaderboard
     * @param {string} gameId - 'arrow-rush' or 'reaction-test'
     * @param {string} name - Player's name
     * @param {number} score - The score or time
     * @param {object} details - Additional stats (count, accuracy, etc.)
     */
    async submitScore(gameId, name, score, details = {}) {
        if (!this.isValidUrl()) {
            console.warn('Leaderboard API URL not configured.');
            return { success: false, error: 'API_NOT_CONFIGURED' };
        }

        try {
            // Google Apps Script Web App requires 'application/json' or 'text/plain' and creates a redirect.
            // Using 'no-cors' prevents reading response, but GAS usually redirects to a content page.
            // Standard fetch with redirect: follow is best.

            // To pass data reliably to doPost, we typically use text/plain content type to avoid OPTIONS preflight issues with GAS.
            // OR use URL parameters for GET, but POST body for data.

            const response = await fetch(this.API_URL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow', // Important for GAS
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', // Bypass preflight
                },
                body: JSON.stringify({
                    gameId,
                    name,
                    score,
                    details: JSON.stringify(details)
                })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Submit Score Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get top scores for a game
     * @param {string} gameId 
     */
    async getScores(gameId) {
        if (!this.isValidUrl()) {
            // Return mock data for testing if no URL
            return this.getMockData(gameId);
        }

        try {
            const url = `${this.API_URL}?gameId=${gameId}&action=get`;
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                redirect: 'follow'
            });

            const result = await response.json();
            if (result.success) {
                return result.leaderboard;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Get Scores Error:', error);
            return [];
        }
    }

    isValidUrl() {
        return this.API_URL && this.API_URL.startsWith('https://script.google.com');
    }

    getMockData(gameId) {
        // Fallback mock data for development
        console.log('Using Mock Leaderboard Data');
        const mockData = [
            { name: 'Morris', score: gameId === 'reaction-test' ? 250 : 1200, date: new Date().toISOString(), details: { accuracy: '95%', count: 120, maxCombo: 50 } },
            { name: 'AI Bot', score: gameId === 'reaction-test' ? 280 : 900, date: new Date().toISOString(), details: { accuracy: '88%', count: 90, maxCombo: 30 } },
            { name: 'Tester', score: gameId === 'reaction-test' ? 300 : 850, date: new Date().toISOString(), details: { accuracy: '80%', count: 85, maxCombo: 15 } },
        ];
        // Sort for mock
        return mockData.sort((a, b) => {
            if (gameId === 'reaction-test') return a.score - b.score;
            return b.score - a.score;
        });
    }
}

// Global instance
const leaderboard = new LeaderboardService();
