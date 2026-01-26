/**
 * Text-to-Speech Utility (React Native / expo-speech)
 *
 * Provides read-aloud functionality using expo-speech.
 * API-compatible with web version for easy migration.
 */

import * as Speech from 'expo-speech';

/** Check if TTS is available (always true on native) */
export function isTTSAvailable(): boolean {
  return true;
}

/** Initialize TTS - no-op on native, voices are always available */
export function initTTS(): void {
  // expo-speech doesn't need initialization
}

/** Cancel any ongoing speech */
export function cancelSpeech(): void {
  Speech.stop();
}

/** Speak text aloud */
export function speak(
  text: string,
  options?: {
    rate?: number; // 0.1 to 2, default 0.9 for kids
    pitch?: number; // 0 to 2, default 1.1 for friendly tone
    volume?: number; // 0 to 1, default 1 (iOS only)
    onEnd?: () => void;
    onError?: (error: Error) => void;
  }
): void {
  // Cancel any existing speech
  Speech.stop();

  Speech.speak(text, {
    rate: options?.rate ?? 0.9,
    pitch: options?.pitch ?? 1.1,
    volume: options?.volume ?? 1,
    language: 'en-US',
    onDone: options?.onEnd,
    onError: (error) => {
      console.warn('TTS error:', error);
      options?.onError?.(new Error(String(error)));
    },
  });
}

/** Speak a category name */
export function speakCategory(category: string): void {
  const friendly = category.replace(/_/g, ' ').toLowerCase();
  speak(`The category is: ${friendly}`);
}

/** Speak the current puzzle state (revealed letters only) */
export function speakPuzzle(
  phrase: string,
  revealedPositions: number[],
  isSolved: boolean
): void {
  if (isSolved) {
    speak(phrase);
    return;
  }

  // Build spoken phrase with "blank" for unrevealed letters
  const spoken: string[] = [];
  const words = phrase.split(' ');
  let charIndex = 0;

  for (const word of words) {
    const wordParts: string[] = [];
    for (const char of word) {
      if (/[A-Z]/i.test(char)) {
        if (revealedPositions.includes(charIndex)) {
          wordParts.push(char);
        } else {
          wordParts.push('blank');
        }
      } else {
        // Punctuation
        wordParts.push(char);
      }
      charIndex++;
    }
    spoken.push(wordParts.join(' '));
    charIndex++; // Account for space
  }

  speak(spoken.join(', next word, '));
}

/** Speak a single word's revealed letters */
export function speakWord(
  word: string,
  startIndex: number,
  revealedPositions: number[]
): void {
  const parts: string[] = [];

  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const globalIndex = startIndex + i;

    if (/[A-Z]/i.test(char)) {
      if (revealedPositions.includes(globalIndex)) {
        parts.push(char);
      } else {
        parts.push('blank');
      }
    }
  }

  speak(parts.join(' ... '));
}

/** Speak letter suggestions */
export function speakSuggestions(letters: string[]): void {
  if (letters.length === 0) return;
  speak(`Try: ${letters.join(', or ')}`);
}

/** Speak feedback for correct/incorrect guesses */
export function speakFeedback(
  isCorrect: boolean,
  letter: string,
  count?: number
): void {
  if (isCorrect) {
    if (count && count > 1) {
      speak(`Yes! There are ${count} ${letter}s!`, { pitch: 1.3 });
    } else {
      speak(`Yes! There is one ${letter}!`, { pitch: 1.3 });
    }
  } else {
    speak(`Nice try! No ${letter} in this puzzle.`, { pitch: 1.0 });
  }
}

/** Speak hint usage */
export function speakHint(hintType: string): void {
  switch (hintType) {
    case 'REVEAL_CONSONANT':
      speak("Here's a consonant to help you!");
      break;
    case 'REVEAL_VOWEL':
      speak("Here's a vowel!");
      break;
    case 'REVEAL_FIRST_LETTERS':
      speak("Here are the first letters of each word!");
      break;
    case 'REVEAL_WORD':
      speak("Here's a whole word!");
      break;
    default:
      speak("Here's a hint!");
  }
}

/** Speak wheel outcome */
export function speakOutcome(label: string, _emoji?: string): void {
  const text = label.replace(/!/g, '');
  speak(`You got: ${text}!`, { pitch: 1.2 });
}

/** Speak puzzle solved celebration */
export function speakCelebration(starsEarned: number): void {
  speak(`Amazing! You solved it! You earned ${starsEarned} stars!`, {
    pitch: 1.3,
    rate: 0.95,
  });
}
