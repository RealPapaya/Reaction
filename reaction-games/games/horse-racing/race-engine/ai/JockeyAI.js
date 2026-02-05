// ====================================
// Jockey AI
// 騎手AI決策系統：戰術規劃、局勢評估、脫困策略
// ====================================

class JockeyAI {
    constructor(settings = {}) {
        this.ANXIETY_BUILD_RATE = settings.anxietyBuildRate || 0.05;
        this.ANXIETY_DECAY_RATE = settings.anxietyDecayRate || 0.02;
        this.ESCAPE_THRESHOLD = settings.escapeThreshold || 0.5;
        this.ESCAPE_PROBABILITY = settings.escapeProbability || 0.3;
    }

    // ====================================
    // 主要決策方法
    // ====================================

    makeDecision(horse, allHorses, frenetCoord, raceProgress) {
        // 1. 評估當前局勢
        const situation = this.analyzeSituation(horse, allHorses, frenetCoord, raceProgress);

        // 2. 檢查是否被困
        if (situation.isBoxedIn) {
            return this.handleBoxedIn(horse, situation);
        }

        // 3. 根據腳質做戰術決策
        return this.executeTactics(horse, situation);
    }

    // ====================================
    // 局勢分析
    // ====================================

    analyzeSituation(horse, allHorses, frenetCoord, raceProgress) {
        const situation = {
            raceProgress: raceProgress,
            position: this.getCurrentPosition(horse, allHorses),
            isBoxedIn: this.checkBoxedIn(horse, allHorses),
            frontHorse: this.getHorseInFront(horse, allHorses),
            leftHorse: this.getHorseOnLeft(horse, allHorses),
            rightHorse: this.getHorseOnRight(horse, allHorses),
            hasGap: false,
            gapDirection: null,
            cornerRadius: frenetCoord.getCornerRadiusAt(horse.s),
            isInCorner: false,
            distanceToFinish: frenetCoord.pathLength - horse.s
        };

        situation.isInCorner = situation.cornerRadius < Infinity;

        // 檢查是否有空隙
        if (!situation.isBoxedIn) {
            situation.hasGap = true;
            situation.gapDirection = this.findBestGap(horse, allHorses);
        }

        return situation;
    }

    getCurrentPosition(horse, allHorses) {
        // 計算當前名次
        let position = 1;
        for (const other of allHorses) {
            if (other.s > horse.s) {
                position++;
            }
        }
        return position;
    }

    checkBoxedIn(horse, allHorses) {
        // 盒子效應：前方、右側、右前方都有馬
        const front = this.getHorseInFront(horse, allHorses);
        const right = this.getHorseOnRight(horse, allHorses);
        const rightFront = this.getHorseRightFront(horse, allHorses);

        return front !== null && right !== null && rightFront !== null;
    }

    getHorseInFront(horse, allHorses) {
        let closest = null;
        let minDist = Infinity;

        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = other.s - horse.s;
            const deltaD = Math.abs(other.d - horse.d);

            if (deltaS > 0 && deltaS < 5 && deltaD < 1.0) {
                if (deltaS < minDist) {
                    minDist = deltaS;
                    closest = other;
                }
            }
        }

        return closest;
    }

    getHorseOnLeft(horse, allHorses) {
        // 左側（內側）
        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = Math.abs(other.s - horse.s);
            const deltaD = horse.d - other.d; // 正數表示 other 在左側

            if (deltaS < 2 && deltaD > 0.5 && deltaD < 2.0) {
                return other;
            }
        }
        return null;
    }

    getHorseOnRight(horse, allHorses) {
        // 右側（外側）
        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = Math.abs(other.s - horse.s);
            const deltaD = other.d - horse.d; // 正數表示 other 在右側

            if (deltaS < 2 && deltaD > 0.5 && deltaD < 2.0) {
                return other;
            }
        }
        return null;
    }

    getHorseRightFront(horse, allHorses) {
        // 右前方
        for (const other of allHorses) {
            if (other === horse) continue;

            const deltaS = other.s - horse.s;
            const deltaD = other.d - horse.d;

            if (deltaS > 0 && deltaS < 3 && deltaD > 0.5 && deltaD < 2.5) {
                return other;
            }
        }
        return null;
    }

    findBestGap(horse, allHorses) {
        // 找到最佳的超車路線
        const leftClear = this.getHorseOnLeft(horse, allHorses) === null;
        const rightClear = this.getHorseOnRight(horse, allHorses) === null;

        if (leftClear && rightClear) {
            return 'left'; // 優先內側
        } else if (leftClear) {
            return 'left';
        } else if (rightClear) {
            return 'right';
        }
        return null;
    }

    // ====================================
    // 被困處理
    // ====================================

    handleBoxedIn(horse, situation) {
        // 增加焦慮值
        if (!horse.anxiety) horse.anxiety = 0;
        horse.anxiety += this.ANXIETY_BUILD_RATE;

        // 強制跟隨前馬速度
        if (situation.frontHorse) {
            horse.speed = Math.min(horse.speed, situation.frontHorse.speed);
        }

        // 焦慮值超過閾值，嘗試脫困
        if (horse.anxiety > this.ESCAPE_THRESHOLD &&
            Math.random() < this.ESCAPE_PROBABILITY) {
            return this.attemptEscape(horse, situation);
        }

        // 繼續等待
        return {
            action: 'wait',
            targetD: horse.d, // 保持當前位置
            targetSpeed: situation.frontHorse ? situation.frontHorse.speed : horse.speed
        };
    }

    attemptEscape(horse, situation) {
        // 嘗試脫困：減速並繞到外側
        return {
            action: 'go_wide',
            targetD: horse.d + 2.0, // 向外移動2米
            targetSpeed: horse.speed * 0.85 // 減速15%
        };
    }

    // ====================================
    // 戰術決策
    // ====================================

    executeTactics(horse, situation) {
        // 降低焦慮值
        if (horse.anxiety) {
            horse.anxiety = Math.max(0, horse.anxiety - this.ANXIETY_DECAY_RATE);
        }

        // 根據腳質決策
        switch (horse.runningStyle) {
            case '逃':
                return this.leadTactics(horse, situation);
            case '前':
                return this.frontTactics(horse, situation);
            case '追':
            case '殿':
                return this.closerTactics(horse, situation);
            default:
                return this.frontTactics(horse, situation);
        }
    }

    // 逃馬戰術
    leadTactics(horse, situation) {
        // 逃馬：盡量搶內欄領先
        if (situation.position <= 2) {
            // 已經在前方，保持位置
            return {
                action: 'maintain_lead',
                targetD: 0.8, // 貼內欄
                targetSpeed: horse.baseSpeed * 1.1
            };
        } else {
            // 還沒領先，加速搶位
            return {
                action: 'push_to_lead',
                targetD: 0.8,
                targetSpeed: horse.baseSpeed * 1.15
            };
        }
    }

    // 前腳戰術
    frontTactics(horse, situation) {
        // 前腳：跟在前方馬群中
        return {
            action: 'follow_pace',
            targetD: 1.5, // 中間位置
            targetSpeed: horse.baseSpeed
        };
    }

    // 追馬/殿腳戰術
    closerTactics(horse, situation) {
        if (situation.raceProgress < 0.7) {
            // 前段：保留體力，跟在後方
            return {
                action: 'conserve_energy',
                targetD: 2.5, // 稍微靠外
                targetSpeed: horse.baseSpeed * 0.9
            };
        } else {
            // 最後直路：尋找空隙衝刺
            if (situation.hasGap) {
                if (situation.gapDirection === 'left') {
                    return {
                        action: 'sprint_inside',
                        targetD: 0.8, // 切內線
                        targetSpeed: horse.baseSpeed * 1.2
                    };
                } else {
                    return {
                        action: 'sprint_outside',
                        targetD: horse.d + 1.5, // 拉外側
                        targetSpeed: horse.baseSpeed * 1.15
                    };
                }
            } else {
                // 沒空隙，等待時機
                return {
                    action: 'wait_for_gap',
                    targetD: horse.d,
                    targetSpeed: horse.baseSpeed * 1.05
                };
            }
        }
    }

    // ====================================
    // 輔助方法
    // ====================================

    shouldTakeRisk(horse, situation) {
        // 判斷是否應該冒險（例如在內側狹窄空間穿越）
        if (situation.distanceToFinish < 100 && situation.position > 3) {
            // 接近終點且排名靠後，值得冒險
            return true;
        }
        return false;
    }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JockeyAI;
}
