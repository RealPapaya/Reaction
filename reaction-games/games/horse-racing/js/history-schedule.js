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
        const tableHTML = `
            <div class="racing-table-container">
                <table class="racing-table">
                    <thead>
                        <tr>
                            <th>時間</th>
                            <th>場次</th>
                            <th>獲勝馬匹</th>
                            <th class="hide-mobile">成績</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map((record, index) => {
            const date = new Date(record.timestamp);
            const dateStr = date.toLocaleString('zh-TW', {
                month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });

            // 更寬鬆的檢查，並提供調試信息
            if (!record.results || !Array.isArray(record.results) || record.results.length === 0) {
                console.warn('⚠️ 歷史紀錄缺少 results:', record);
                return `
                                    <tr class="history-row error">
                                        <td>${dateStr}</td>
                                        <td>第 ${record.raceNumber} 場</td>
                                        <td colspan="3" style="color: #999;">
                                            ⚠️ 無比賽數據
                                            <button onclick="localStorage.clear(); location.reload();" 
                                                    style="margin-left:10px; padding:4px 8px; font-size:0.8rem; cursor:pointer;">
                                                清除所有數據
                                            </button>
                                        </td>
                                    </tr>
                                `;
            }

            const winner = record.results[0];
            const detailId = `detail-${trackId}-${record.raceNumber}`;

            // 使用安全的屬性訪問
            const horseName = winner?.horse?.name || '未知';
            const horseId = winner?.horse?.id || '?';
            const finishTime = winner?.finishTime || 0;

            return `
                                <tr class="history-row" onclick="toggleDetail('${detailId}', this)" style="cursor:pointer;">
                                    <td>${dateStr}</td>
                                    <td>第 ${record.raceNumber} 場</td>
                                    <td>
                                        <div class="winner-cell">
                                            <span>🥇</span>
                                            <span>#${horseId} ${horseName}</span>
                                        </div>
                                    </td>
                                    <td class="hide-mobile">${finishTime.toFixed(2)}s</td>
                                    <td>
                                        <button class="btn-table-action btn-replay-sm" 
                                            onclick="event.stopPropagation(); game.showReplayModal('${trackId}', ${record.raceNumber});">
                                            🎬 <span class="hide-mobile">重播</span>
                                        </button>
                                        <button class="btn-table-action" onclick="event.stopPropagation(); toggleDetail('${detailId}', this.closest('tr'));">
                                            詳情 <span class="toggle-icon">▼</span>
                                        </button>
                                    </td>
                                </tr>
                                <tr id="${detailId}" class="detail-row">
                                    <td colspan="5">
                                        <div class="detail-content">
                                            <table class="detail-table">
                                                <thead>
                                                    <tr>
                                                        <th>排名</th>
                                                        <th>馬號</th>
                                                        <th>馬名</th>
                                                        <th>完賽時間</th>
                                                        <th>落後</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${record.results.map((r, i) => {
                const gap = i === 0 ? '-' : `+${(r.finishTime - winner.finishTime).toFixed(2)}s`;
                const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1) + '.';
                return `
                                                            <tr>
                                                                <td>${medal}</td>
                                                                <td>#${r?.horse?.id || '?'}</td>
                                                                <td>${r?.horse?.name || '未知'}</td>
                                                                <td>${(r?.finishTime || 0).toFixed(2)}s</td>
                                                                <td>${gap}</td>
                                                            </tr>
                                                        `;
            }).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        historyContainer.innerHTML = tableHTML;
    }

    document.getElementById('history-modal').classList.add('show');
};

// 全局切換詳情函數
window.toggleDetail = function (detailId, rowElement) {
    const detailRow = document.getElementById(detailId);
    if (detailRow) {
        detailRow.classList.toggle('show');
        rowElement.classList.toggle('expanded');
    }
};

HorseRacingGame.prototype.showTrackSchedule = function (trackId) {
    const track = raceScheduler.getTrackData(trackId);
    const schedule = raceScheduler.getTrackSchedule(trackId, 8);

    document.getElementById('schedule-modal-title').textContent = `${track.flagEmoji} ${track.name} - 賽程表`;

    const scheduleContainer = document.getElementById('schedule-records-container');

    // 清除舊計時器
    if (window.scheduleTimer) {
        clearInterval(window.scheduleTimer);
        window.scheduleTimer = null;
    }

    const tableHTML = `
        <div class="racing-table-container">
            <table class="racing-table">
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>時間</th>
                        <th>場次</th>
                        <th>狀態</th>
                        <th>投注倒數/備註</th>
                    </tr>
                </thead>
                <tbody>
                    ${schedule.map(item => {
        const date = new Date(item.raceStartTime);
        const dateStr = date.toLocaleString('zh-TW', {
            month: '2-digit', day: '2-digit'
        });
        const timeStr = date.toLocaleString('zh-TW', {
            hour: '2-digit', minute: '2-digit'
        });

        const now = Date.now();
        const timeUntil = item.raceStartTime - now;
        const minutesUntil = Math.floor(timeUntil / 60000);

        let statusBadge = '';
        let countdownText = '';
        let rowClass = '';

        if (item.isCurrent) {
            statusBadge = '<span class="schedule-status betting">🟢 投注中</span>';
            countdownText = `<span class="dynamic-countdown" data-end="${item.raceStartTime}" style="color: #e91e63; font-weight: bold;">計算中...</span>`;
            rowClass = 'current-race-row';
        } else if (minutesUntil > 0) {
            statusBadge = '<span class="schedule-status upcoming">🟡 準備中</span>';
            countdownText = `還有 ${minutesUntil} 分鐘`;
        } else {
            statusBadge = '<span class="schedule-status finished">🔴 已結束</span>';
            countdownText = '-';
        }

        return `
                            <tr class="${rowClass}">
                                <td>${dateStr}</td>
                                <td>${timeStr}</td>
                                <td>第 ${item.raceNumber} 場</td>
                                <td>${statusBadge}</td>
                                <td>${countdownText}</td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    scheduleContainer.innerHTML = tableHTML;

    document.getElementById('schedule-modal').classList.add('show');

    // 啟動倒數計時器
    if (typeof startScheduleTimer === 'function') {
        startScheduleTimer();
    } else {
        setTimeout(() => {
            if (typeof startScheduleTimer === 'function') startScheduleTimer();
        }, 100);
    }
};

window.startScheduleTimer = function () {
    const update = () => {
        const modal = document.getElementById('schedule-modal');
        if (!modal || !modal.classList.contains('show')) {
            if (window.scheduleTimer) clearInterval(window.scheduleTimer);
            return;
        }

        const countdowns = document.querySelectorAll('.dynamic-countdown');
        countdowns.forEach(el => {
            const end = parseInt(el.dataset.end);
            const diff = end - Date.now();

            if (diff <= 0) {
                el.textContent = '⛔ 截止';
                el.style.color = 'red';
            } else {
                const min = Math.floor(diff / 60000);
                const sec = Math.floor((diff % 60000) / 1000);
                el.textContent = `⏱️ ${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
            }
        });
    };

    update();
    window.scheduleTimer = setInterval(update, 1000);
};
