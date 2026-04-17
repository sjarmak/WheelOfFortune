import React, { useMemo } from 'react';
import { getPhonicsChunks, getVowelHints } from '../engine/phonics';
import { Volume2, BookOpenCheck } from 'lucide-react';
import { isTTSAvailable, speak } from '../engine/tts';

interface PhonicsHelperProps {
  phrase: string;
  readAloudEnabled: boolean;
}

export const PhonicsHelper: React.FC<PhonicsHelperProps> = ({ phrase, readAloudEnabled }) => {
  const chunks = useMemo(() => getPhonicsChunks(phrase), [phrase]);
  const vowelHints = useMemo(() => getVowelHints(phrase), [phrase]);
  const ttsAvailable = isTTSAvailable();

  const handleSpeakChunk = (chunk: string, sample?: string) => {
    if (!readAloudEnabled || !ttsAvailable) return;
    const message = sample ? `${chunk} like ${sample}` : chunk;
    speak(message, { rate: 0.9 });
  };

  const handleSpeakVowel = (spoken: string) => {
    if (!readAloudEnabled || !ttsAvailable) return;
    speak(spoken, { rate: 0.9 });
  };

  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-3 text-white shadow-inner w-full">
      <div className="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.2em] text-white/70 mb-2">
        <BookOpenCheck className="w-3 h-3" />
        Phonics Helper
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-white/80 mb-1">Sound chunks from this puzzle</p>
          {chunks.length === 0 ? (
            <p className="text-[0.7rem] text-white/60">No special chunks here—try the vowel helper below.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {chunks.map(chunk => (
                <button
                  key={`${chunk.type}-${chunk.chunk}`}
                  onClick={() => handleSpeakChunk(chunk.chunk, chunk.words[0])}
                  className="px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-left shadow flex-1 min-w-[110px]"
                  aria-label={`Hear the ${chunk.chunk} sound`}
                >
                  <div className="text-sm font-bold">{chunk.chunk}</div>
                  <div className="text-[0.65rem] text-white/70">{chunk.hint}</div>
                  <div className="text-[0.6rem] text-white/60 mt-1 truncate">
                    {chunk.words.join(', ')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-white/80 mb-1 flex items-center gap-1">
            <Volume2 className="w-3 h-3" /> Guided vowel helper
          </p>
          {vowelHints.length === 0 ? (
            <p className="text-[0.7rem] text-white/60">No vowels here—solved already!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vowelHints.map((vowel, idx) => (
                <button
                  key={`${vowel.vowel}-${idx}`}
                  onClick={() => handleSpeakVowel(vowel.spoken)}
                  className="px-3 py-1.5 rounded-full bg-purple-600/60 hover:bg-purple-600 text-sm font-semibold"
                  aria-label={`Hear vowel ${vowel.vowel}`}
                >
                  {vowel.vowel} • {vowel.hint}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
