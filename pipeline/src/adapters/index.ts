import fs from 'fs-extra';
import { NormalizedPuzzle } from '../types.js';

export interface Adapter {
  parse(filePath: string): Promise<Omit<NormalizedPuzzle, 'id' | 'normalized' | 'difficulty'>[]>;
}

export interface RawAdapterInput {
  filePath: string;
  sourceType: 'kaggle_csv' | 'text' | 'json';
}
