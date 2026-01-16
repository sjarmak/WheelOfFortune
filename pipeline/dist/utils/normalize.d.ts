export declare function normalizeCategory(raw: string): string;
export declare function generatePuzzleId(phrase: string, category: string, roundType: string): string;
export declare function validatePhrase(phrase: string): {
    valid: boolean;
    reason?: string;
};
export declare function getCleanLetters(phrase: string): string[];
