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

    // Generate deterministic race results
    generateResults(horses, raceSeed) {
        // Convert seed string to number
        let seedNum = 0;
        for (let i = 0; i < raceSeed.length; i++) {
            seedNum += raceSeed.charCodeAt(i) * (i + 1);
        }

        // Create a copy of horses with seeded performance
        const horsesWithPerformance = horses.map((horse, index) => {
            // Each horse gets a unique random value based on seed
            const random1 = this.seededRandom(seedNum + index * 7);
            const random2 = this.seededRandom(seedNum + index * 13);
            const random3 = this.seededRandom(seedNum + index * 19);

            // Calculate performance (weighted by competitive factor)
            const basePerformance = horse.competitiveFactor || 0.5;
            const variance = (random1 * 0.3 + random2 * 0.3 + random3 * 0.4);
            const performance = basePerformance * (0.7 + variance * 0.6);

            return {
                ...horse,
                performance: performance,
                finalTime: 30 - (performance * 3) // Simulated finishing time
            };
        });

        // Sort by performance (descending = better)
        horsesWithPerformance.sort((a, b) => b.performance - a.performance);

        // Return results with positions
        return horsesWithPerformance.map((horse, index) => ({
            position: index + 1,
            horse: horse,
            time: horse.finalTime.toFixed(2)
        }));
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
