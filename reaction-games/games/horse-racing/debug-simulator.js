// 快速診斷腳本 - 在 console 中執行

console.log('=== 診斷腳本開始 ===');

// 1. 檢查必要的物件是否存在
console.log('1. 檢查物件:');
console.log('  - raceScheduler:', typeof raceScheduler);
console.log('  - BackgroundSimulator:', typeof BackgroundSimulator);
console.log('  - RaceSimulator:', typeof RaceSimulator);
console.log('  - generateHorses:', typeof generateHorses);

// 2. 生成測試馬匹
console.log('\n2. 生成馬匹:');
const testHorses = generateHorses();
console.log('  - 馬匹數量:', testHorses.length);
console.log('  - 第一匹馬:', testHorses[0]);

// 3. 設置馬匹閘門和狀態
const gates = [1, 2, 3, 4, 5, 6, 7, 8];
testHorses.forEach((horse, index) => {
    horse.gateNumber = gates[index];
    horse.todayCondition = horse.generateTodayCondition(Math.random() * 1000);
});

// 4. 獲取賽道
console.log('\n3. 取得賽道:');
const testTrack = RACETRACKS[0]; // Tokyo
console.log('  - 賽道:', testTrack.id, testTrack.name);

// 5. 創建 BackgroundSimulator
console.log('\n4. 創建 BackgroundSimulator:');
const testSeed = 'test_seed_' + Date.now();
const bgSim = new BackgroundSimulator(testHorses, testTrack, testSeed);
console.log('  - BackgroundSimulator 已創建');

// 6. 執行模擬
console.log('\n5. 執行模擬:');
console.log('  - 開始時間:', new Date().toLocaleTimeString());

try {
    const result = bgSim.runFullSimulation();
    console.log('  - 結束時間:', new Date().toLocaleTimeString());
    console.log('  - 結果:', result);
    console.log('  - results.length:', result.results ? result.results.length : 'undefined');

    if (result.results && result.results.length > 0) {
        console.log('✅ 測試成功！');
        console.log('結果:', result.results);
    } else {
        console.error('❌ 測試失敗：results 為空');
        console.log('完整 result:', result);
    }
} catch (error) {
    console.error('❌ 執行錯誤:', error);
    console.error('堆疊:', error.stack);
}

console.log('\n=== 診斷腳本結束 ===');
