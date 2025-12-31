import crypto from 'crypto';
import { CANONICAL_CATEGORIES } from '../types.js';

export function normalizeCategory(raw: string): string {
  if (!raw) return 'OTHER';
  
  // Basic cleanup
  const upper = raw.trim().toUpperCase().replace(/&/g, 'AND').replace(/[^A-Z0-9_ ]/g, '');
  const slug = upper.replace(/\s+/g, '_');

  // Direct match
  if ((CANONICAL_CATEGORIES as unknown as string[]).includes(slug)) {
    return slug;
  }

  // Fuzzy / Mapping
  if (slug === 'FOOD_&_DRINK' || slug === 'FOOD_DRINK') return 'FOOD_AND_DRINK';
  if (slug === 'SAME_LETTER') return 'PHRASE'; // Mapping some specific ones or keep as OTHER
  if (slug.includes('THINGS')) return 'THING';
  if (slug.includes('PEOPLE')) return 'PERSON';
  if (slug.includes('PLACES')) return 'PLACE';

  return 'OTHER'; // Default fallback
}

export function generatePuzzleId(phrase: string, category: string, roundType: string): string {
  // Dedupe key: Remove punctuation, collapse whitespace, uppercase
  const cleanPhrase = phrase.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanCat = category.toUpperCase().trim();
  const cleanType = roundType.toUpperCase().trim();
  const input = `${cleanPhrase}|${cleanCat}|${cleanType}`;
  return crypto.createHash('sha1').update(input).digest('hex');
}

export function validatePhrase(phrase: string): { valid: boolean; reason?: string } {
  if (!phrase || phrase.length < 3) return { valid: false, reason: 'too_short' };
  
  const letters = phrase.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 2) return { valid: false, reason: 'not_enough_letters' };
  
  const nonsense = /([A-Z])\1{3,}/; // 4 same chars in a row
  if (nonsense.test(phrase.toUpperCase())) return { valid: false, reason: 'nonsense_repeat' };

  return { valid: true };
}

export function getCleanLetters(phrase: string): string[] {
  return phrase.toUpperCase().replace(/[^A-Z]/g, '').split('');
}
