export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  // Mulberry32
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Helper for range [min, max)
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  // Fisher-Yates shuffle
  shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}
