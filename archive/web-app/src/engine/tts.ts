/**
 * Text-to-Speech Utility
 *
 * Provides read-aloud functionality using Web Speech API.
 * Gracefully degrades when API is unavailable.
 */

// Cache for loaded voices
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

/** Check if TTS is available */
export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined';
}

/** Initialize voices - call this early in app lifecycle */
export function initTTS(): void {
  if (!isTTSAvailable()) return;

  const loadVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices();
    voicesLoaded = cachedVoices.length > 0;
  };

  // Load voices immediately if available
  loadVoices();

  // Also listen for voices changed event (Chrome loads async)
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  // Fallback: try again after a short delay
  if (!voicesLoaded) {
    setTimeout(loadVoices, 100);
    setTimeout(loadVoices, 500);
    setTimeout(loadVoices, 1000);
  }
}

/** Cancel any ongoing speech */
export function cancelSpeech(): void {
  if (isTTSAvailable()) {
    window.speechSynthesis.cancel();
  }
}

/** Get the best available voice */
function getBestVoice(): SpeechSynthesisVoice | null {
  // Refresh voices if needed
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }

  if (cachedVoices.length === 0) return null;

  // Prefer kid-friendly voices
  const preferredNames = ['Samantha', 'Karen', 'Moira', 'Fiona', 'Victoria', 'Google US English'];

  for (const name of preferredNames) {
    const voice = cachedVoices.find(v => v.name.includes(name));
    if (voice) return voice;
  }

  // Fallback to any English voice
  return cachedVoices.find(v => v.lang.startsWith('en')) || cachedVoices[0];
}

/** Speak text aloud */
export function speak(text: string, options?: {
  rate?: number;      // 0.1 to 2, default 0.9 for kids
  pitch?: number;     // 0 to 2, default 1.1 for friendly tone
  volume?: number;    // 0 to 1, default 1
  onEnd?: () => void;
  onError?: (error: Error) => void;
}): void {
  if (!isTTSAvailable()) {
    options?.onEnd?.();
    return;
  }

  // Cancel any existing speech and wait a tick for it to clear
  window.speechSynthesis.cancel();

  // Use setTimeout to let the cancel operation complete before starting new speech
  // This fixes Chrome bug where rapid cancel+speak causes immediate cancellation
  setTimeout(() => {
    // Chrome bug: speechSynthesis can get stuck, resume it
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 0.9;
    utterance.pitch = options?.pitch ?? 1.1;
    utterance.volume = options?.volume ?? 1;

    // Set voice
    const voice = getBestVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => options?.onEnd?.();
    utterance.onerror = (event) => {
      // "canceled" is expected when new speech interrupts old speech - don't log it
      if (event.error !== 'canceled') {
        console.warn('TTS error:', event.error);
      }
      options?.onError?.(new Error(event.error));
    };

    window.speechSynthesis.speak(utterance);

    // Chrome bug: sometimes speech queue gets stuck - kick it
    setTimeout(() => {
      if (window.speechSynthesis.pending && !window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 100);

    // Chrome long-text bug: pause/resume to keep it going
    if (text.length > 100) {
      const resumeInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(resumeInterval);
        } else {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);

      utterance.onend = () => {
        clearInterval(resumeInterval);
        options?.onEnd?.();
      };
    }
  }, 10); // Small delay to let cancel() complete
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
        // Punctuation - skip or announce?
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
    rate: 0.95
  });
}
