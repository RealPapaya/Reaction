// ====================================
// 爆冷機制測試腳本 - 勝率分佈驗證
// ====================================

function testUpsetRate() {
    console.log('=== 爆冷機制驗證 ===\n');
    console.log('目標：熱門馬勝率 30-35%，冷門馬勝率 3-6%');
    console.log('模擬 100 場比賽...\n');

    const wins = {};
    const oddsByHorse = {};
    const incidentStats = {
        slowStart: 0,
        blocked: 0,
        wideTrip: 0
    };

    // 模擬 100 場比賽
    for (let i = 0; i < 100; i++) {
        // 生成馬匹
        const horses = [];
        for (let j = 1; j <= 8; j++) {
            horses.push(new Horse(j));
        }

        // 模擬 race-scheduler 的初始化過程
        const raceSeed = `test_race_${i}_${Date.now()}`;
        const gates = [1, 2, 3, 4, 5, 6, 7, 8];

        // 打亂檔位
        for (let k = gates.length - 1; k > 0; k--) {
            const j = Math.floor(Math.random() * (k + 1));
            [gates[k], gates[j]] = [gates[j], gates[k]];
        }

        horses.forEach((horse, index) => {
            horse.gateNumber = gates[index];
            const seedValue = Math.abs((raceSeed + horse.id).split('').reduce((a, b) => a + b.charCodeAt(0), 0));
            horse.todayCondition = horse.generateTodayCondition(seedValue);
        });

        // 計算賠率（模擬 game.js 的邏輯）
        const calculateOddsRating = (horse) => {
            const ratingScore = horse.competitiveFactor * 0.40;
            const formScore = (horse.trendScore / 10) * 0.25;
            const jockeyScore = (horse.jockey.experience / 20) * 0.15;
            const gateScore = (horse.gateNumber <= 4 ? 0.10 : 0.05);
            const distanceScore = Math.random() * 0.10;
            return ratingScore + formScore + jockeyScore + gateScore + distanceScore;
        };

        const totalOddsRating = horses.reduce((sum, h) => sum + calculateOddsRating(h), 0);
        horses.forEach(horse => {
            const oddsRating = calculateOddsRating(horse);
            const impliedProbability = oddsRating / totalOddsRating;
            const rawOdds = (1 / impliedProbability) * 0.85;
            horse.odds = Math.max(1.5, Math.min(25, rawOdds));
        });

        // 生成比賽結果
        const results = raceResultGenerator.generateResults(horses, raceSeed);
        const winner = results[0].horse;

        // 記錄獲勝次數
        if (!wins[winner.id]) wins[winner.id] = 0;
        wins[winner.id]++;

        // 記錄賠率
        oddsByHorse[winner.id] = (oddsByHorse[winner.id] || []);
        oddsByHorse[winner.id].push(winner.odds);

        // 統計事故發生率
        horses.forEach(horse => {
            if (horse.incidents) {
                if (horse.incidents.slowStart) incidentStats.slowStart++;
                if (horse.incidents.blocked) incidentStats.blocked++;
                if (horse.incidents.wideTrip) incidentStats.wideTrip++;
            }
        });
    }

    console.log('\n=== 勝率分佈統計 ===');

    // 將結果按照平均賠率排序
    const sortedResults = Object.keys(wins).map(horseId => ({
        horseId,
        wins: wins[horseId],
        winRate: (wins[horseId] / 100 * 100).toFixed(1),
        avgOdds: (oddsByHorse[horseId].reduce((a, b) => a + b, 0) / oddsByHorse[horseId].length).toFixed(2)
    })).sort((a, b) => a.avgOdds - b.avgOdds);

    console.log('\n馬號 | 平均賠率 | 獲勝次數 | 勝率');
    console.log('-----|---------|---------|-------');
    sortedResults.forEach(result => {
        const oddsRange = result.avgOdds < 3 ? '(熱門)' :
            result.avgOdds < 8 ? '(中等)' : '(冷門)';
        console.log(`${result.horseId}號  | ${result.avgOdds}x ${oddsRange} | ${result.wins}次 | ${result.winRate}%`);
    });

    // 驗證目標
    const favorite = sortedResults[0];
    const longShot = sortedResults[sortedResults.length - 1];

    console.log('\n=== 目標驗證 ===');
    console.log(`✅ 熱門馬勝率: ${favorite.winRate}% (目標: 30-35%)`);
    console.log(`✅ 冷門馬勝率: ${longShot.winRate}% (目標: 3-6%)`);

    const favoritePass = favorite.winRate >= 30 && favorite.winRate <= 35;
    const longShotPass = longShot.winRate >= 3 && longShot.winRate <= 6;

    if (favoritePass && longShotPass) {
        console.log('\n🎉 測試通過！爆冷機制運作正常！');
    } else {
        console.log('\n⚠️ 測試未完全通過，可能需要微調參數');
    }

    console.log('\n=== 事故發生統計 ===');
    console.log(`漏閘 (Slow Start): ${incidentStats.slowStart} 次 (${(incidentStats.slowStart / 800 * 100).toFixed(1)}%)`);
    console.log(`受困 (Blocked): ${incidentStats.blocked} 次 (${(incidentStats.blocked / 800 * 100).toFixed(1)}%)`);
    console.log(`走外疊 (Wide Trip): ${incidentStats.wideTrip} 次 (${(incidentStats.wideTrip / 800 * 100).toFixed(1)}%)`);
}

// 執行測試
console.log('開始測試爆冷機制...\n');
testUpsetRate();
console.log('\n測試完成!');
