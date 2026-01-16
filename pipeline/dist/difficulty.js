import { extractLetters, calculateVowelRatio, countUniqueLetters, countRareLetters, countWords } from './normalize/index.js';
/**
 * Compute difficulty score for a phrase
 *
 * Factors:
 * - Letter count (more = harder)
 * - Vowel ratio (very low or very high = harder, low is worse)
 * - Rare letters (J, Q, X, Z = harder)
 * - Unique letter count (more unique = harder)
 * - Word count (more words = slightly harder)
 *
 * Returns score 0-1 where 1 is hardest
 */
export function computeDifficulty(phrase) {
    const letters = extractLetters(phrase);
    const letterCount = letters.length;
    const wordCount = countWords(phrase);
    const vowelRatio = calculateVowelRatio(letters);
    const uniqueLetters = countUniqueLetters(letters);
    const rareLetters = countRareLetters(letters);
    const reasons = [];
    let score = 0;
    // Base difficulty from letter count (3-50 letters mapped to 0-0.3)
    const lengthFactor = Math.min((letterCount - 3) / 47, 1) * 0.3;
    score += lengthFactor;
    if (letterCount > 25) {
        reasons.push('long_phrase');
    }
    // Vowel ratio factor
    // Ideal is around 0.35-0.45
    // Very low (<0.2) or very high (>0.6) is harder
    let vowelFactor = 0;
    if (vowelRatio < 0.2) {
        vowelFactor = (0.2 - vowelRatio) * 1.5; // Up to 0.3
        reasons.push('low_vowel_ratio');
    }
    else if (vowelRatio > 0.6) {
        vowelFactor = (vowelRatio - 0.6) * 0.75; // Up to 0.3
        reasons.push('high_vowel_ratio');
    }
    score += Math.min(vowelFactor, 0.3);
    // Rare letters (each adds 0.05, max 0.2)
    if (rareLetters > 0) {
        const rareFactor = Math.min(rareLetters * 0.05, 0.2);
        score += rareFactor;
        reasons.push(`rare_letters_count:${rareLetters}`);
    }
    // Unique letters factor (more unique = harder)
    // 5-20 unique letters mapped to 0-0.15
    if (uniqueLetters > 10) {
        const uniqueFactor = Math.min((uniqueLetters - 10) / 10, 1) * 0.15;
        score += uniqueFactor;
        if (uniqueLetters > 12) {
            reasons.push('high_unique_letters');
        }
    }
    // Word count factor (slight increase for many words)
    if (wordCount > 4) {
        score += Math.min((wordCount - 4) * 0.02, 0.05);
    }
    // Common patterns that make puzzles harder
    if (phrase.includes("'")) {
        score += 0.02;
        reasons.push('has_apostrophe');
    }
    // Patterns that might make puzzles easier (popular phrases)
    const lowerPhrase = phrase.toLowerCase();
    const easyPatterns = [
        'the ', ' and ', ' of ', ' is ', ' in ', ' to ',
    ];
    const hasEasyPatterns = easyPatterns.filter(p => lowerPhrase.includes(p)).length;
    if (hasEasyPatterns >= 2) {
        score -= 0.05;
    }
    // Check for common endings that might be guessable
    if (phrase.endsWith('ING')) {
        reasons.push('ends_in_ing');
    }
    if (phrase.endsWith('TION')) {
        reasons.push('ends_in_tion');
    }
    // Clamp to 0-1
    score = Math.max(0, Math.min(1, score));
    // Round to 1 decimal
    score = Math.round(score * 10) / 10;
    return { score, reasons };
}
