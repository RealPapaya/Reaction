// ====================================
// Race Result Generator
// Deterministic results based on seed
// ====================================

class RaceResultGenerator {
    // Seeded Random Number Generator (基於種子的隨機數生成器)
    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    // Generate deterministic race results with upsets
    generateResults(horses, raceSeed) {
        // Convert seed string to number
        let seedNum = 0;
        for (let i = 0; i < raceSeed.length; i++) {
            seedNum += raceSeed.charCodeAt(i) * (i + 1);
        }

        // Create seeded RNG function
        const createRNG = (seed) => {
            let currentSeed = seed;
            return () => {
                currentSeed = (currentSeed * 9301 + 49297) % 233280;
                return currentSeed / 233280;
            };
        };

        const rng = createRNG(seedNum);

        // Create a copy of horses with performance calculation
        const horsesWithPerformance = horses.map((horse, index) => {
            // 1️⃣ 表現常態分佈（0.85-1.15）- 能力90的馬可能只發揮76.5，能力80的馬可能超常發揮到92
            const performanceVariance = 0.85 + (rng() * 0.30);

            // 2️⃣ 當日狀態影響（±10%）
            const conditionMultiplier = horse.todayCondition ? horse.todayCondition.multiplier : 1.0;

            // 3️⃣ 比賽事故判定（與腳質聯動）
            const incidents = this.determineIncidents(horse, rng);

            // 4️⃣ 計算最終表現分數
            let finalPerformance = horse.competitiveFactor *
                performanceVariance *
                conditionMultiplier;

            // 應用事故懲罰（根據腳質調整）
            if (incidents.slowStart) {
                // 逃馬漏閘是致命傷
                const penalty = horse.runningStyle === '逃' ? 0.70 : 0.80;
                finalPerformance *= penalty;
            }
            if (incidents.blocked) {
                // 追馬受困影響最大
                const penalty = (horse.runningStyle === '追' || horse.runningStyle === '殿') ? 0.65 : 0.75;
                finalPerformance *= penalty;
            }
            if (incidents.wideTrip) {
                finalPerformance *= 0.90; // 走外疊 -10%
            }

            return {
                ...horse,
                performanceVariance,
                incidents,
                finalPerformance,
                finalTime: 30 - (finalPerformance * 3)
            };
        });

        // Sort by performance (descending = better)
        horsesWithPerformance.sort((a, b) => b.finalPerformance - a.finalPerformance);

        // Return results with positions
        return horsesWithPerformance.map((horse, index) => ({
            position: index + 1,
            horse: horse,
            time: horse.finalTime.toFixed(2)
        }));
    }

    // 比賽事故判定邏輯（與腳質聯動）
    determineIncidents(horse, rng) {
        // 漏閘機率：逃馬風險較高
        const slowStartChance = horse.runningStyle === '逃' ? 0.08 : 0.05;

        // 受困機率：追/殿馬 + 內欄 = 高風險
        let blockedChance = 0.15;
        if (horse.runningStyle === '追' || horse.runningStyle === '殿') {
            blockedChance = horse.gateNumber <= 4 ? 0.35 : 0.20; // 內欄追馬容易被關廁所
        } else if (horse.gateNumber <= 3) {
            blockedChance = 0.25; // 其他馬內欄也有風險
        }

        // 走外疊機率：外檔馬風險高
        const wideTripChance = horse.gateNumber >= 6 ? 0.20 : 0.10;

        return {
            slowStart: rng() < slowStartChance,
            blocked: rng() < blockedChance,
            wideTrip: rng() < wideTripChance
        };
    }

    // Quick check: get winner without full results
    getWinner(horses, raceSeed) {
        const results = this.generateResults(horses, raceSeed);
        return results[0];
    }

    // Check if specific horse won
    isWinner(horses, raceSeed, horseId) {
        const winner = this.getWinner(horses, raceSeed);
        return winner.horse.id === horseId;
    }
}

// Create global instance
const raceResultGenerator = new RaceResultGenerator();
