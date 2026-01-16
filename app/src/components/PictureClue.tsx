import React, { useMemo } from 'react';
import { derivePictureClues } from '../engine/pictureClues';
import { Image } from 'lucide-react';

interface PictureClueProps {
  phrase: string;
  category: string;
}

export const PictureClue: React.FC<PictureClueProps> = ({ phrase, category }) => {
  const clues = useMemo(() => derivePictureClues(phrase, category), [phrase, category]);

  return (
    <div
      className="w-full max-w-xl mx-auto bg-white/10 border border-white/15 rounded-3xl px-4 py-3 text-white shadow-inner"
      aria-label="Picture clue for the puzzle"
    >
      <div className="flex items-center gap-2 text-[0.6rem] tracking-[0.2em] uppercase text-white/70 mb-2">
        <Image className="w-3 h-3" aria-hidden="true" />
        Picture Clue (read this like a rebus)
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {clues.map((clue, index) => (
          <React.Fragment key={`${clue.symbol}-${clue.label}`}>
            <div className="flex flex-col items-center bg-black/30 rounded-2xl px-3 py-2 min-w-[4.5rem]">
              <span className="text-3xl" aria-hidden="true">{clue.symbol}</span>
              <span className="text-xs font-semibold text-white/90 tracking-wide">
                {clue.label}
              </span>
            </div>
            {index < clues.length - 1 && (
              <span className="text-white/60 font-bold text-lg" aria-hidden="true">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <p className="text-[0.65rem] text-white/60 mt-2 text-center">
        Use these mini pictures to guess the phrase before spinning!
      </p>
    </div>
  );
};
