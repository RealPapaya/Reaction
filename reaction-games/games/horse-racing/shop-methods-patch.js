// ====================================
// 商店系統代碼補丁 - 需要插入到 game.js 中 saveStats() 方法之後
// ====================================

// ====================================
// Shop System
// ====================================

renderShopScreen() {
    const statuses = raceScheduler.getAllTrackStatuses();

    // 只顯示投注中的賽道
    const bettingTracks = statuses.filter(s => s.phase === 'BETTING');

    if (bettingTracks.length === 0) {
        this.dom.racingFormList.innerHTML = `
                <p class="no-products">目前沒有可購買的馬報</p>
            `;
        return;
    }

    this.dom.racingFormList.innerHTML = bettingTracks.map(status => {
        const track = raceScheduler.getTrackData(status.trackId);
        const isPurchased = shopManager.isPurchased(status.trackId, status.raceNumber);

        return `
                <div class="product-card">
                    <div class="product-icon">📰</div>
                    <div class="product-info">
                        <h4>${track.flagEmoji} ${track.name} - 第 ${status.raceNumber} 場</h4>
                        <p class="product-status">
                            <span class="status-betting">投注中</span>
                            <span class="time-remaining">還剩 ${this.formatTime(status.timeRemaining)}</span>
                        </p>
                    </div>
                    <div class="product-action">
                        ${isPurchased ?
                '<span class="purchased-badge">✅ 已購買</span>' :
                `<button class="btn btn-primary buy-btn" data-track-id="${status.trackId}" data-race-number="${status.raceNumber}" data-price="50">購買 $50</button>`
            }
                    </div>
                </div>
            `;
    }).join('');

    // 綁定購買按鈕事件
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const trackId = e.target.dataset.trackId;
            const raceNumber = parseInt(e.target.dataset.raceNumber);
            const price = parseInt(e.target.dataset.price);
            this.purchaseRacingForm(trackId, raceNumber, price);
        });
    });
}

purchaseRacingForm(trackId, raceNumber, price) {
    const result = shopManager.purchaseRacingForm(trackId, raceNumber, this.balance, price);

    if (result.success) {
        // 扣款
        this.balance = result.newBalance;
        this.saveBalance();
        this.updateBalanceDisplay();

        // 重新渲染商店
        this.renderShopScreen();

        alert(`✅ ${result.message}！\n返回投注頁面查看馬報`);
    } else {
        alert(`❌ ${result.message}`);
    }
}

updateRacingFormDisplay(trackId, raceNumber) {
    const isPurchased = shopManager.isPurchased(trackId, raceNumber);

    if (isPurchased) {
        // 顯示已購買的馬報
        this.dom.racingFormLocked.style.display = 'none';
        this.dom.racingFormUnlocked.style.display = 'block';

        // 綁定展開/收起按鈕
        if (this.dom.formToggle) {
            this.dom.formToggle.onclick = () => {
                const isExpanded = this.dom.formContent.style.display === 'block';
                this.dom.formContent.style.display = isExpanded ? 'none' : 'block';
                this.dom.formToggle.textContent = isExpanded ? '展開' : '收起';
            };
        }

        // 填充馬報數據
        const horses = raceScheduler.getOrGenerateHorses(trackId);
        this.renderRacingFormTable(horses);
    } else {
        // 顯示鎖定狀態
        this.dom.racingFormLocked.style.display = 'flex';
        this.dom.racingFormUnlocked.style.display = 'none';

        // 綁定購買按鈕
        if (this.dom.buyFormBtn) {
            this.dom.buyFormBtn.onclick = () => {
                this.purchaseRacingForm(trackId, raceNumber, 50);
            };
        }
    }
}

renderRacingFormTable(horses) {
    const formData = shopManager.getRacingFormData(horses);

    this.dom.formTableBody.innerHTML = formData.map(horse => `
            <tr>
                <td>${horse.id}</td>
                <td>${horse.name}</td>
                <td><span class="running-style-badge">${horse.runningStyle}</span></td>
                <td>第${horse.gateNumber}檔</td>
                <td class="paddock-cell">${horse.paddockObservation}</td>
            </tr>
        `).join('');
}

updateBalanceDisplay() {
    // 更新所有餘額顯示位置
    if (this.dom.balanceAmount) {
        this.dom.balanceAmount.textContent = `$${this.balance.toLocaleString()}`;
    }
    if (this.dom.navBalance) {
        this.dom.navBalance.textContent = this.balance.toLocaleString();
    }
}
