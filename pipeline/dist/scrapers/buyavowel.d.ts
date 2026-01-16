/**
 * Scraper for Buy a Vowel Boards Compendium
 * https://buyavowel.boards.net/page/compendiumindex
 *
 * Structured data with season, episode, date, category, and round type
 */
interface ScrapedPuzzle {
    phrase: string;
    category: string;
    date: string;
    episode?: string;
    round: string;
    season: number;
}
declare const SEASONS: {
    season: number;
    url: string;
    years: string;
}[];
/**
 * Map round codes to round types
 */
declare function parseRoundType(round: string): 'MAIN' | 'TOSSUP' | 'BONUS';
/**
 * Scrape all seasons and save to JSON files
 */
export declare function scrapeAllSeasons(outDir: string, seasonRange?: {
    start: number;
    end: number;
}, delayMs?: number): Promise<void>;
export { SEASONS, ScrapedPuzzle, parseRoundType };
