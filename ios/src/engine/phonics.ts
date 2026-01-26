export type PhonicsChunkType = 'family' | 'digraph' | 'blend';

export interface PhonicsChunk {
  type: PhonicsChunkType;
  chunk: string;
  words: string[];
  hint: string;
}

export interface VowelSound {
  vowel: string;
  isLong: boolean;
  word: string;
  spoken: string;
}

export interface VowelHint {
  vowel: string;
  hint: string;
  spoken: string;
}

const SOUND_FAMILIES = ['AT', 'AN', 'IT', 'OP', 'UG'];
const DIGRAPHS = ['SH', 'CH', 'TH', 'WH', 'PH', 'CK', 'NG'];
const BLENDS = ['ST', 'TR', 'BR', 'CL', 'BL', 'PL', 'GR', 'CR', 'FL', 'SL', 'SP', 'SK'];

const FAMILY_HINTS: Record<string, string> = {
  AT: 'as in CAT',
  AN: 'as in FAN',
  IT: 'as in SIT',
  OP: 'as in HOP',
  UG: 'as in BUG'
};

const DIGRAPH_HINTS: Record<string, string> = {
  SH: 'shh sound',
  CH: 'ch like CHIP',
  TH: 'th like THE',
  WH: 'wh like WHAT',
  PH: 'f sound',
  CK: 'k sound',
  NG: 'ng like RING'
};

const BLEND_HINTS: Record<string, string> = {
  ST: 'st- blend',
  TR: 'tr- blend',
  BR: 'br- blend',
  CL: 'cl- blend',
  BL: 'bl- blend',
  PL: 'pl- blend',
  GR: 'gr- blend',
  CR: 'cr- blend',
  FL: 'fl- blend',
  SL: 'sl- blend',
  SP: 'sp- blend',
  SK: 'sk- blend'
};

// Long vowel examples for TTS
const LONG_VOWEL_EXAMPLES: Record<string, string> = {
  A: 'cake',
  E: 'tree',
  I: 'bike',
  O: 'home',
  U: 'cute'
};

// Short vowel examples for TTS
const SHORT_VOWEL_EXAMPLES: Record<string, string> = {
  A: 'cat',
  E: 'bed',
  I: 'sit',
  O: 'hot',
  U: 'cup'
};

const WORD_REGEX = /[^A-Z]/g;

function normalizeWords(phrase: string): string[] {
  return phrase
    .toUpperCase()
    .replace(WORD_REGEX, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Detect if a vowel in a word is long or short based on phonics rules
 */
function detectVowelSound(word: string, vowelIndex: number): 'long' | 'short' | 'silent' {
  const upper = word.toUpperCase();
  const vowel = upper[vowelIndex];
  const len = upper.length;

  // Silent E at end of word
  if (vowel === 'E' && vowelIndex === len - 1 && len > 2) {
    const prevChar = upper[vowelIndex - 1];
    // E is silent if preceded by consonant (MAKE, HOME, etc.)
    if (!'AEIOU'.includes(prevChar)) {
      return 'silent';
    }
  }

  // Y at end acting as long I (MY, FLY, SKY) or long E (HAPPY, FUNNY)
  if (vowel === 'Y' && vowelIndex === len - 1) {
    // Short words ending in Y = long I (MY, BY, FLY)
    if (len <= 3) return 'long';
    // Longer words ending in Y = long E sound (HAPPY)
    return 'long';
  }

  // Silent E rule: vowel-consonant-E pattern makes first vowel long
  if (vowelIndex < len - 2) {
    const nextChar = upper[vowelIndex + 1];
    const afterNext = upper[vowelIndex + 2];
    // Pattern: Vowel + Consonant + E at end (MAKE, HOME, BIKE, CUTE)
    if (!'AEIOU'.includes(nextChar) && afterNext === 'E' && vowelIndex + 2 === len - 1) {
      return 'long';
    }
  }

  // Vowel teams that make long sounds
  if (vowelIndex < len - 1) {
    const pair = upper.substring(vowelIndex, vowelIndex + 2);
    const longTeams = ['AI', 'AY', 'EA', 'EE', 'IE', 'OA', 'OE', 'OW', 'UE', 'UI'];
    if (longTeams.includes(pair)) {
      return 'long';
    }
  }

  // Open syllable (vowel at end of word or followed by another vowel) = long
  if (vowelIndex === len - 1 && len <= 3) {
    // HE, ME, GO, NO, HI, etc.
    return 'long';
  }

  // R-controlled vowels are neither strictly long nor short
  if (vowelIndex < len - 1 && upper[vowelIndex + 1] === 'R') {
    return 'short'; // Simplify for kids
  }

  // Default: closed syllable (CVC pattern) = short
  return 'short';
}

/**
 * Get the phonetic sound for a single letter in context
 */
export function getLetterSound(letter: string, word: string, positionInWord: number): string {
  const upper = letter.toUpperCase();
  const wordUpper = word.toUpperCase();

  // Consonant sounds
  const CONSONANT_SOUNDS: Record<string, string> = {
    B: 'buh',
    C: wordUpper[positionInWord + 1] === 'E' || wordUpper[positionInWord + 1] === 'I' ? 'sss' : 'kuh',
    D: 'duh',
    F: 'fff',
    G: 'guh',
    H: 'huh',
    J: 'juh',
    K: 'kuh',
    L: 'lll',
    M: 'mmm',
    N: 'nnn',
    P: 'puh',
    Q: 'kwuh',
    R: 'rrr',
    S: 'sss',
    T: 'tuh',
    V: 'vvv',
    W: 'wuh',
    X: 'ks',
    Y: positionInWord === 0 ? 'yuh' : 'ee',
    Z: 'zzz'
  };

  if (CONSONANT_SOUNDS[upper]) {
    return CONSONANT_SOUNDS[upper];
  }

  // Vowel sounds depend on context
  if ('AEIOU'.includes(upper)) {
    const soundType = detectVowelSound(wordUpper, positionInWord);
    if (soundType === 'silent') {
      return 'silent';
    }
    if (soundType === 'long') {
      // Long vowels say their name
      return `long ${upper}, like ${LONG_VOWEL_EXAMPLES[upper]}`;
    }
    // Short vowel
    return `short ${upper}, like ${SHORT_VOWEL_EXAMPLES[upper]}`;
  }

  return upper;
}

function collectChunks(
  words: string[],
  list: string[],
  type: PhonicsChunkType,
  matcher: (word: string, chunk: string) => boolean,
  hints: Record<string, string>
): PhonicsChunk[] {
  const chunks: PhonicsChunk[] = [];

  for (const chunk of list) {
    const matches = words.filter(word => matcher(word, chunk));
    if (matches.length > 0) {
      chunks.push({
        type,
        chunk,
        words: matches.slice(0, 2),
        hint: hints[chunk] || `${chunk} sound`
      });
    }
  }

  return chunks;
}

export function getPhonicsChunks(phrase: string): PhonicsChunk[] {
  const words = normalizeWords(phrase);

  const families = collectChunks(
    words,
    SOUND_FAMILIES,
    'family',
    (word, chunk) => word.endsWith(chunk) && word.length <= 6,
    FAMILY_HINTS
  );

  const digraphs = collectChunks(
    words,
    DIGRAPHS,
    'digraph',
    (word, chunk) => word.includes(chunk),
    DIGRAPH_HINTS
  );

  const blends = collectChunks(
    words,
    BLENDS,
    'blend',
    (word, chunk) => word.startsWith(chunk),
    BLEND_HINTS
  );

  return [...families, ...digraphs, ...blends].slice(0, 6);
}

/**
 * Analyze vowels in the phrase and determine their sounds
 */
export function getVowelHints(phrase: string, limit = 4): VowelHint[] {
  const words = normalizeWords(phrase);
  const vowelSounds: Map<string, VowelHint> = new Map();

  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if ('AEIOUY'.includes(char)) {
        const soundType = detectVowelSound(word, i);

        if (soundType === 'silent') continue;

        const key = `${char}-${soundType}`;
        if (!vowelSounds.has(key)) {
          const isLong = soundType === 'long';
          const example = isLong ? LONG_VOWEL_EXAMPLES[char] : SHORT_VOWEL_EXAMPLES[char];

          // Handle Y specially
          let hint: string;
          let spoken: string;
          if (char === 'Y') {
            hint = word.length <= 3 ? `Long I in "${word}"` : `Long E in "${word}"`;
            spoken = word.length <= 3
              ? `Y makes the long I sound, like in ${word}`
              : `Y makes the long E sound, like in ${word}`;
          } else {
            hint = isLong ? `Long ${char} in "${word}"` : `Short ${char} like "${example}"`;
            spoken = isLong
              ? `Long ${char}, says its name, like in ${word}`
              : `Short ${char}, like in ${example}`;
          }

          vowelSounds.set(key, {
            vowel: char,
            hint,
            spoken
          });
        }
      }
    }
  }

  // Sort: long vowels first (more interesting), then by vowel order
  const sorted = Array.from(vowelSounds.values()).sort((a, b) => {
    const aLong = a.hint.includes('Long') ? 0 : 1;
    const bLong = b.hint.includes('Long') ? 0 : 1;
    return aLong - bLong;
  });

  return sorted.slice(0, limit);
}
