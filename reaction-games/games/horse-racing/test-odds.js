// ====================================
// 賠率系統測試腳本
// ====================================

// 測試走勢評分系統
function testTrendScore() {
    console.log('=== 測試走勢評分系統 ===');

    const testCases = [
        { trend: [1, 3, 6, 3, 1], expected: '高分 (近況極佳)' },
        { trend: [5, 2, 3, 1, 7], expected: '中等分數' },
        { trend: [7, 8, 6, 5, 8], expected: '低分 (近況差)' }
    ];

    testCases.forEach(test => {
        const scoreMap = { 1: 10, 2: 7, 3: 5, 4: 3, 5: 2, 6: 1, 7: 0.5, 8: 0 };
        const weights = [0.35, 0.25, 0.2, 0.12, 0.08];

        const score = test.trend.reduce((total, rank, index) => {
            return total + (scoreMap[rank] || 0) * weights[index];
        }, 0);

        console.log(`走勢 ${test.trend.join('-')} → 評分: ${score.toFixed(2)} (${test.expected})`);
    });
}

// 測試賠率計算
function testOddsCalculation() {
    console.log('\n=== 測試賠率計算 ===');

    // 模擬8匹馬
    const horses = [];
    for (let i = 1; i <= 8; i++) {
        horses.push(new Horse(i));
    }

    // 計算賠率
    const totalCompetitive = horses.reduce((sum, h) => sum + h.competitiveFactor, 0);

    console.log('馬匹競爭力分析:');
    horses.forEach(horse => {
        const winProbability = horse.competitiveFactor / totalCompetitive;
        const bookmakerMargin = 0.85;
        const rawOdds = (1 / winProbability) * bookmakerMargin;
        const odds = Math.max(1.5, Math.min(15, rawOdds));

        console.log(`${horse.id}號 ${horse.name}`);
        console.log(`  走勢: ${horse.lastFiveTrend.join('-')} (評分: ${horse.trendScore.toFixed(2)})`);
        console.log(`  負磅: ${horse.weightCarried}kg (懲罰: ${((1 - horse.weightPenalty) * 100).toFixed(1)}%)`);
        console.log(`  狀態: ${horse.conditionStatus} (係數: ${horse.conditionFactor})`);
        console.log(`  競爭力: ${horse.competitiveFactor.toFixed(4)}`);
        console.log(`  勝率: ${(winProbability * 100).toFixed(2)}%`);
        console.log(`  賠率: ${odds.toFixed(2)}x\n`);
    });

    // 統計賠率分佈
    const oddsValues = horses.map(h => {
        const winProb = h.competitiveFactor / totalCompetitive;
        const rawOdds = (1 / winProb) * 0.85;
        return Math.max(1.5, Math.min(15, rawOdds));
    });

    console.log('賠率分佈統計:');
    console.log(`  最低賠率: ${Math.min(...oddsValues).toFixed(2)}x`);
    console.log(`  最高賠率: ${Math.max(...oddsValues).toFixed(2)}x`);
    console.log(`  平均賠率: ${(oddsValues.reduce((a, b) => a + b, 0) / oddsValues.length).toFixed(2)}x`);

    const lowOdds = oddsValues.filter(o => o < 4).length;
    const midOdds = oddsValues.filter(o => o >= 4 && o < 8).length;
    const highOdds = oddsValues.filter(o => o >= 8).length;

    console.log(`  低賠率 (<4x): ${lowOdds} 匹`);
    console.log(`  中賠率 (4-8x): ${midOdds} 匹`);
    console.log(`  高賠率 (>8x): ${highOdds} 匹`);
}

// 測試玩家期望值
function testPlayerExpectedValue() {
    console.log('\n=== 測試玩家期望值 ===');

    let totalBet = 0;
    let totalReturn = 0;

    // 模擬1000場比賽
    for (let i = 0; i < 1000; i++) {
        const horses = [];
        for (let j = 1; j <= 8; j++) {
            horses.push(new Horse(j));
        }

        const totalCompetitive = horses.reduce((sum, h) => sum + h.competitiveFactor, 0);

        horses.forEach(horse => {
            const winProb = horse.competitiveFactor / totalCompetitive;
            const rawOdds = (1 / winProb) * 0.85;
            horse.odds = Math.max(1.5, Math.min(15, rawOdds));
        });

        // 隨機選一匹馬投注100元
        const randomHorse = horses[Math.floor(Math.random() * horses.length)];
        totalBet += 100;

        // 根據競爭力決定是否獲勝
        const winner = horses.reduce((best, h) =>
            h.competitiveFactor > best.competitiveFactor ? h : best
        );

        if (winner.id === randomHorse.id) {
            totalReturn += 100 * randomHorse.odds;
        }
    }

    const returnRate = (totalReturn / totalBet) * 100;
    console.log(`總投注: $${totalBet.toLocaleString()}`);
    console.log(`總回報: $${totalReturn.toLocaleString()}`);
    console.log(`回報率: ${returnRate.toFixed(2)}% (預期約85%)`);
}

// 執行所有測試
console.log('開始測試賠率系統...\n');
testTrendScore();
testOddsCalculation();
testPlayerExpectedValue();
console.log('\n測試完成!');
