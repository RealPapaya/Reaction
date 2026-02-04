// ====================================
// Racetracks Database
// ====================================

const RACETRACKS = [
    {
        id: 'ascot',
        name: '雅士谷',
        nameEn: 'Ascot',
        region: '歐洲',
        location: '英國',
        flagEmoji: '🇬🇧',
        surface: 'turf',
        surfaceDisplay: '草地',
        signature: '皇家雅士谷賽事 (Royal Ascot)',
        description: '英國皇室直屬馬場，擁有極長的最後直路，是英國最負盛名的草地賽事場地之一。',
        trackShape: 'oval',
        // Track path for rendering (normalized 0-1 coordinates, will be scaled to canvas)
        pathPoints: [
            // Starting line (right side)
            { x: 0.85, y: 0.5 },
            // Top curve
            { x: 0.85, y: 0.25 },
            { x: 0.75, y: 0.15 },
            { x: 0.5, y: 0.1 },
            { x: 0.25, y: 0.15 },
            { x: 0.15, y: 0.25 },
            // Left turn
            { x: 0.15, y: 0.5 },
            // Bottom curve
            { x: 0.15, y: 0.75 },
            { x: 0.25, y: 0.85 },
            { x: 0.5, y: 0.9 },
            { x: 0.75, y: 0.85 },
            // Final straight (characteristic of Ascot)
            { x: 0.85, y: 0.75 },
            { x: 0.85, y: 0.5 }
        ],
        characteristics: {
            gradient: 'low',
            lastStraight: 'very-long',
            難度: '中等'
        }
    },
    {
        id: 'churchill',
        name: '邱吉爾園',
        nameEn: 'Churchill Downs',
        region: '北美',
        location: '美國肯塔基',
        flagEmoji: '🇺🇸',
        surface: 'dirt',
        surfaceDisplay: '泥地',
        signature: '肯塔基德比 (Kentucky Derby)',
        description: '全球最著名的泥地賽道，肯塔基德比的舉辦地，氛圍極其狂熱，象徵美國賽馬文化。',
        trackShape: 'oval',
        pathPoints: [
            { x: 0.85, y: 0.5 },
            { x: 0.85, y: 0.3 },
            { x: 0.7, y: 0.15 },
            { x: 0.5, y: 0.1 },
            { x: 0.3, y: 0.15 },
            { x: 0.15, y: 0.3 },
            { x: 0.15, y: 0.5 },
            { x: 0.15, y: 0.7 },
            { x: 0.3, y: 0.85 },
            { x: 0.5, y: 0.9 },
            { x: 0.7, y: 0.85 },
            { x: 0.85, y: 0.7 },
            { x: 0.85, y: 0.5 }
        ],
        characteristics: {
            gradient: 'flat',
            lastStraight: 'medium',
            難度: '簡單'
        }
    },
    {
        id: 'shatin',
        name: '沙田',
        nameEn: 'Sha Tin',
        region: '亞洲',
        location: '香港',
        flagEmoji: '🇭🇰',
        surface: 'turf',
        surfaceDisplay: '草地',
        signature: '香港國際賽事',
        description: '設備極其現代化的世界級馬場，直路衝刺與過彎邏輯極其嚴謹，代表亞洲賽馬的最高水準。',
        trackShape: 'oval',
        pathPoints: [
            { x: 0.85, y: 0.5 },
            { x: 0.85, y: 0.25 },
            { x: 0.75, y: 0.12 },
            { x: 0.5, y: 0.08 },
            { x: 0.25, y: 0.12 },
            { x: 0.15, y: 0.25 },
            { x: 0.12, y: 0.5 },
            { x: 0.15, y: 0.75 },
            { x: 0.25, y: 0.88 },
            { x: 0.5, y: 0.92 },
            { x: 0.75, y: 0.88 },
            { x: 0.85, y: 0.75 },
            { x: 0.85, y: 0.5 }
        ],
        characteristics: {
            gradient: 'medium',
            lastStraight: 'long',
            難度: '困難'
        }
    },
    {
        id: 'flemington',
        name: '費明頓',
        nameEn: 'Flemington',
        region: '大洋洲',
        location: '澳洲墨爾本',
        flagEmoji: '🇦🇺',
        surface: 'turf',
        surfaceDisplay: '草地',
        signature: '墨爾本盃 (Melbourne Cup)',
        description: '「令全國停頓的賽事」舉辦地，草地質素極佳，是南半球最重要的賽馬場地。',
        trackShape: 'oval',
        pathPoints: [
            { x: 0.85, y: 0.5 },
            { x: 0.85, y: 0.28 },
            { x: 0.73, y: 0.14 },
            { x: 0.5, y: 0.1 },
            { x: 0.27, y: 0.14 },
            { x: 0.15, y: 0.28 },
            { x: 0.15, y: 0.5 },
            { x: 0.15, y: 0.72 },
            { x: 0.27, y: 0.86 },
            { x: 0.5, y: 0.9 },
            { x: 0.73, y: 0.86 },
            { x: 0.85, y: 0.72 },
            { x: 0.85, y: 0.5 }
        ],
        characteristics: {
            gradient: 'low',
            lastStraight: 'medium',
            難度: '中等'
        }
    }
];

// Helper function to get track by ID
function getTrackById(trackId) {
    return RACETRACKS.find(track => track.id === trackId);
}

// Helper function to get tracks by region
function getTracksByRegion(region) {
    return RACETRACKS.filter(track => track.region === region);
}
