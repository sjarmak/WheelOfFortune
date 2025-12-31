export interface DifficultyResult {
  score: number;
  reasons: string[];
}

export function calculateDifficulty(phrase: string): DifficultyResult {
  const reasons: string[] = [];
  let score = 0.3; // Base difficulty

  const upper = phrase.toUpperCase();
  const letters = upper.replace(/[^A-Z]/g, '');
  const uniqueLetters = new Set(letters).size;
  const length = letters.length;
  const wordCount = upper.split(/\s+/).length;

  // Length factor
  if (length > 25) {
    score += 0.2;
    reasons.push('long_phrase');
  } else if (length < 8) {
    score -= 0.1;
    reasons.push('short_phrase');
  }

  // Vowel ratio
  const vowels = letters.match(/[AEIOU]/g)?.length || 0;
  const ratio = vowels / (length || 1);
  if (ratio < 0.25) {
    score += 0.2;
    reasons.push('low_vowels');
  }

  // Rare letters (JQXZ)
  const rareCount = (letters.match(/[JQXZ]/g) || []).length;
  if (rareCount > 0) {
    score += 0.15 * rareCount;
    reasons.push(`rare_letters_count:${rareCount}`);
  }

  // Common endings help
  if (upper.endsWith('ING')) {
    score -= 0.05;
    reasons.push('ends_in_ing');
  }

  // Unique letter density
  const uniqueRatio = uniqueLetters / (length || 1);
  if (uniqueRatio > 0.7) {
    score += 0.1;
    reasons.push('high_unique_letters');
  }

  // Clamp
  score = Math.max(0.1, Math.min(1.0, score));
  
  return { score: Number(score.toFixed(2)), reasons };
}
