import { type Pack, type Report, type RoundType } from './schema.js';
export interface IngestOptions {
    inputs: string[];
    pack: string;
    seed: string;
    categoriesInclude?: string[];
    categoriesExclude?: string[];
    roundTypes?: RoundType[];
    minLength?: number;
    maxLength?: number;
    difficultyMin?: number;
    difficultyMax?: number;
    limit?: number;
    dryRun?: boolean;
    strict?: boolean;
    outdir: string;
}
export interface IngestResult {
    pack: Pack;
    report: Report;
}
/**
 * Main ingestion function
 */
export declare function ingestPuzzles(options: IngestOptions): Promise<IngestResult>;
