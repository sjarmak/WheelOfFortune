/**
 * Mulberry32 seeded PRNG - deterministic random number generation
 */
export class SeededRNG {
    state;
    constructor(seed) {
        // Convert string seed to number via simple hash
        if (typeof seed === 'string') {
            let hash = 0;
            for (let i = 0; i < seed.length; i++) {
                const char = seed.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            this.state = Math.abs(hash) || 1;
        }
        else {
            this.state = seed || 1;
        }
    }
    /**
     * Returns a random float between 0 and 1
     */
    random() {
        let t = (this.state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    /**
     * Returns a random integer between min (inclusive) and max (exclusive)
     */
    randomInt(min, max) {
        return Math.floor(this.random() * (max - min)) + min;
    }
    /**
     * Shuffle an array in place using Fisher-Yates
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i + 1);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    /**
     * Sample n items from array
     */
    sample(array, n) {
        const shuffled = this.shuffle(array);
        return shuffled.slice(0, n);
    }
}
