/**
 * Mulberry32 seeded PRNG - deterministic random number generation
 */
export declare class SeededRNG {
    private state;
    constructor(seed: string | number);
    /**
     * Returns a random float between 0 and 1
     */
    random(): number;
    /**
     * Returns a random integer between min (inclusive) and max (exclusive)
     */
    randomInt(min: number, max: number): number;
    /**
     * Shuffle an array in place using Fisher-Yates
     */
    shuffle<T>(array: T[]): T[];
    /**
     * Sample n items from array
     */
    sample<T>(array: T[], n: number): T[];
}
