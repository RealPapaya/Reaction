// ====================================
// History & Schedule Extensions for HorseRacingGame
// ====================================

// 擴展 HorseRacingGame 類別
HorseRacingGame.prototype.showTrackHistory = function (trackId) {
    const track = raceScheduler.getTrackData(trackId);
    const history = raceScheduler.getTrackHistory(trackId, 10);

    document.getElementById('history-modal-title').textContent = `${track.flagEmoji} ${track.name} - 歷史紀錄`;

    const historyContainer = document.getElementById('history-records-container');

    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="no-history">暫無歷史紀錄</p>';
    } else {
        historyContainer.innerHTML = history.map((record, index) => {
            const date = new Date(record.timestamp);
            const dateStr = date.toLocaleString('zh-TW', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            const medals = ['🥇', '🥈', '🥉'];
            const resultsHTML = record.results.map((r, i) => {
                const medal = i < 3 ? medals[i] : '';
                return `
                    <div class="result-row">
                        <span class="result-rank">${medal} ${r.position}.</span>
                        <span class="result-horse">#${r.horse.id} ${r.horse.name}</span>
                        <span class="result-time">${r.finishTime.toFixed(2)}s</span>
                    </div>
                `;
            }).join('');

            // 第一筆資料預設展開
            const isFirst = index === 0;
            const headerClass = isFirst ? 'history-record-header expanded' : 'history-record-header';
            const resultsClass = isFirst ? 'history-record-results show' : 'history-record-results';

            return `
                <div class="history-record-card">
                    <div class="${headerClass}" onclick="this.classList.toggle('expanded'); this.nextElementSibling.classList.toggle('show');">
                        <h4>第 ${record.raceNumber} 場</h4>
                        <span class="history-record-time">${dateStr}</span>
                    </div>
                    <div class="${resultsClass}">
                        ${resultsHTML}
                    </div>
                </div>
            `;
        }).join('');
    }

    document.getElementById('history-modal').classList.add('show');
};

HorseRacingGame.prototype.showTrackSchedule = function (trackId) {
    const track = raceScheduler.getTrackData(trackId);
    const schedule = raceScheduler.getTrackSchedule(trackId, 8);

    document.getElementById('schedule-modal-title').textContent = `${track.flagEmoji} ${track.name} - 賽程表`;

    const scheduleContainer = document.getElementById('schedule-records-container');

    scheduleContainer.innerHTML = schedule.map(item => {
        const date = new Date(item.raceStartTime);
        const timeStr = date.toLocaleString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const now = Date.now();
        const timeUntil = item.raceStartTime - now;
        const minutesUntil = Math.floor(timeUntil / 60000);

        let statusHTML = '';
        if (item.isCurrent) {
            statusHTML = '<span class="schedule-status current">當前場次</span>';
        } else if (minutesUntil > 0) {
            statusHTML = `<span class="schedule-status upcoming">還有 ${minutesUntil} 分鐘</span>`;
        } else {
            statusHTML = '<span class="schedule-status past">已結束</span>';
        }

        return `
            <div class="schedule-record-card ${item.isCurrent ? 'current' : ''}">
                <div class="schedule-record-header">
                    <h4>第 ${item.raceNumber} 場</h4>
                    ${statusHTML}
                </div>
                <div class="schedule-record-time">
                    預計開始時間：${timeStr}
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('schedule-modal').classList.add('show');
};
