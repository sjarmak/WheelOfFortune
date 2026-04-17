import { KidCategory } from './kidTypes';

export interface PictureClue {
  symbol: string;
  label: string;
}

const KEYWORD_CLUES: Record<string, PictureClue> = {
  CAT: { symbol: '🐱', label: 'Cat' },
  DOG: { symbol: '🐶', label: 'Dog' },
  BIRD: { symbol: '🐦', label: 'Bird' },
  FROG: { symbol: '🐸', label: 'Frog' },
  FISH: { symbol: '🐠', label: 'Fish' },
  LION: { symbol: '🦁', label: 'Lion' },
  PIG: { symbol: '🐷', label: 'Pig' },
  HORSE: { symbol: '🐴', label: 'Horse' },
  FOX: { symbol: '🦊', label: 'Fox' },
  BEE: { symbol: '🐝', label: 'Bee' },
  APPLE: { symbol: '🍎', label: 'Apple' },
  CARROT: { symbol: '🥕', label: 'Carrot' },
  PIZZA: { symbol: '🍕', label: 'Pizza' },
  CAKE: { symbol: '🎂', label: 'Cake' },
  MILK: { symbol: '🥛', label: 'Milk' },
  BREAD: { symbol: '🍞', label: 'Bread' },
  PARK: { symbol: '🌳', label: 'Park' },
  FARM: { symbol: '🚜', label: 'Farm' },
  HOME: { symbol: '🏠', label: 'Home' },
  MOM: { symbol: '👩', label: 'Mom' },
  DAD: { symbol: '👨', label: 'Dad' },
  BABY: { symbol: '👶', label: 'Baby' },
  BUS: { symbol: '🚌', label: 'Bus' },
  CAR: { symbol: '🚗', label: 'Car' },
  TRAIN: { symbol: '🚂', label: 'Train' },
  TREE: { symbol: '🌲', label: 'Tree' },
  SUN: { symbol: '☀️', label: 'Sun' },
  MOON: { symbol: '🌙', label: 'Moon' },
  STAR: { symbol: '⭐', label: 'Star' },
  BOOK: { symbol: '📘', label: 'Book' },
  ROBOT: { symbol: '🤖', label: 'Robot' }
};

const CATEGORY_CLUES: Record<KidCategory | 'DEFAULT', PictureClue[]> = {
  ANIMALS: [
    { symbol: '🐾', label: 'Animal tracks' },
    { symbol: '🦴', label: 'Pet treat' },
    { symbol: '🌿', label: 'Nature' }
  ],
  FOOD: [
    { symbol: '🍽️', label: 'Meal time' },
    { symbol: '🥣', label: 'Bowl' },
    { symbol: '🧃', label: 'Drink' }
  ],
  FAMILY: [
    { symbol: '🏡', label: 'Home' },
    { symbol: '👨‍👩‍👧', label: 'Family' },
    { symbol: '❤️', label: 'Love' }
  ],
  COLORS: [
    { symbol: '🎨', label: 'Palette' },
    { symbol: '🌈', label: 'Rainbow' },
    { symbol: '🖍️', label: 'Crayon' }
  ],
  ACTIONS: [
    { symbol: '🏃', label: 'Move' },
    { symbol: '🎲', label: 'Play' },
    { symbol: '🎵', label: 'Sound' }
  ],
  SIMPLE_PHRASES: [
    { symbol: '💬', label: 'Phrase' },
    { symbol: '✍️', label: 'Words' },
    { symbol: '🙂', label: 'Smile' }
  ],
  PLACES: [
    { symbol: '🗺️', label: 'Map' },
    { symbol: '🏖️', label: 'Destination' },
    { symbol: '🏙️', label: 'City' }
  ],
  THINGS: [
    { symbol: '🎁', label: 'Thing' },
    { symbol: '🧸', label: 'Toy' },
    { symbol: '🔧', label: 'Object' }
  ],
  FUN_WORDS: [
    { symbol: '🎉', label: 'Fun' },
    { symbol: '🤹', label: 'Play' },
    { symbol: '✨', label: 'Magic' }
  ],
  DEFAULT: [
    { symbol: '🧠', label: 'Guess' },
    { symbol: '🧩', label: 'Puzzle' },
    { symbol: '🔍', label: 'Clue' }
  ]
};

const WORD_REGEX = /[^A-Z]/g;

export function derivePictureClues(
  phrase: string,
  category: string,
  limit = 3
): PictureClue[] {
  const normalizedWords = phrase
    .toUpperCase()
    .replace(WORD_REGEX, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const clues: PictureClue[] = [];
  const used = new Set<string>();

  const pushUnique = (clue: PictureClue) => {
    if (!used.has(clue.label) && clues.length < limit) {
      clues.push(clue);
      used.add(clue.label);
    }
  };

  for (const word of normalizedWords) {
    const clue = KEYWORD_CLUES[word];
    if (clue) {
      pushUnique(clue);
      if (clues.length >= limit) {
        return clues;
      }
    }
  }

  const fallbackCategory = (category?.toUpperCase() as KidCategory) ?? 'DEFAULT';
  const fallback = CATEGORY_CLUES[fallbackCategory] ?? CATEGORY_CLUES.DEFAULT;

  for (const clue of fallback) {
    pushUnique(clue);
  }

  if (clues.length === 0) {
    pushUnique({ symbol: '🧩', label: 'Puzzle clue' });
  }

  return clues.slice(0, limit);
}
