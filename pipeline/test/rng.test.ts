import { describe, it, expect } from 'vitest';
import { SeededRNG } from '../src/rng.js';

describe('SeededRNG', () => {
  it('produces deterministic output with same seed', () => {
    const rng1 = new SeededRNG('test-seed');
    const rng2 = new SeededRNG('test-seed');
    
    expect(rng1.random()).toBe(rng2.random());
    expect(rng1.random()).toBe(rng2.random());
    expect(rng1.random()).toBe(rng2.random());
  });

  it('produces different output with different seeds', () => {
    const rng1 = new SeededRNG('seed-a');
    const rng2 = new SeededRNG('seed-b');
    
    expect(rng1.random()).not.toBe(rng2.random());
  });

  it('randomInt returns values in range', () => {
    const rng = new SeededRNG('test');
    
    for (let i = 0; i < 100; i++) {
      const val = rng.randomInt(0, 10);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(10);
    }
  });

  it('shuffle is deterministic', () => {
    const rng1 = new SeededRNG('shuffle-seed');
    const rng2 = new SeededRNG('shuffle-seed');
    
    const arr1 = [1, 2, 3, 4, 5];
    const arr2 = [1, 2, 3, 4, 5];
    
    expect(rng1.shuffle(arr1)).toEqual(rng2.shuffle(arr2));
  });

  it('sample returns correct number of items', () => {
    const rng = new SeededRNG('sample');
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    const sampled = rng.sample(arr, 3);
    expect(sampled.length).toBe(3);
  });

  it('sample is deterministic', () => {
    const rng1 = new SeededRNG('sample-seed');
    const rng2 = new SeededRNG('sample-seed');
    
    const arr = ['a', 'b', 'c', 'd', 'e'];
    
    expect(rng1.sample(arr, 2)).toEqual(rng2.sample(arr, 2));
  });
});
