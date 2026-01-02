import { describe, it, expect } from 'vitest';
import { mapCategory } from '../src/normalize/category.js';

describe('mapCategory', () => {
  it('maps common variants to canonical', () => {
    expect(mapCategory('phrase').category).toBe('PHRASE');
    expect(mapCategory('PHRASE').category).toBe('PHRASE');
    expect(mapCategory('Phrase').category).toBe('PHRASE');
  });

  it('maps food and drink variants', () => {
    expect(mapCategory('food & drink').category).toBe('FOOD_AND_DRINK');
    expect(mapCategory('Food and Drink').category).toBe('FOOD_AND_DRINK');
    expect(mapCategory('food').category).toBe('FOOD_AND_DRINK');
  });

  it('maps title variants', () => {
    expect(mapCategory('title').category).toBe('TITLE');
    expect(mapCategory('song title').category).toBe('TITLE');
    expect(mapCategory('movie').category).toBe('TITLE');
  });

  it('returns OTHER for unknown categories', () => {
    const result = mapCategory('WEIRD_CATEGORY');
    expect(result.category).toBe('OTHER');
    expect(result.original).toBe('WEIRD_CATEGORY');
  });

  it('handles empty input', () => {
    expect(mapCategory('').category).toBe('OTHER');
    expect(mapCategory(undefined).category).toBe('OTHER');
  });

  it('preserves original for OTHER', () => {
    const result = mapCategory('My Custom Category');
    expect(result.category).toBe('OTHER');
    expect(result.original).toBe('My Custom Category');
  });
});
