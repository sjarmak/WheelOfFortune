import { describe, it, expect } from 'vitest';
import { derivePictureClues } from '../engine/pictureClues';

describe('derivePictureClues', () => {
  it('creates clues for known keywords in the phrase', () => {
    const clues = derivePictureClues('BIG DOG RUN', 'ANIMALS');
    expect(clues[0]).toEqual({ symbol: '🐶', label: 'Dog' });
  });

  it('falls back to category icons when no keywords are found', () => {
    const clues = derivePictureClues('MYSTERY WORD', 'PLACES');
    expect(clues.length).toBeGreaterThan(0);
    expect(clues[0].label).toBe('Map');
  });

  it('limits the number of returned clues', () => {
    const clues = derivePictureClues('CAT DOG BIRD FROG', 'ANIMALS', 2);
    expect(clues).toHaveLength(2);
  });
});
