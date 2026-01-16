export interface DifficultyResult {
    score: number;
    reasons: string[];
}
export declare function calculateDifficulty(phrase: string): DifficultyResult;
