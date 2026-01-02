/**
 * Scraper for Buy a Vowel Boards Compendium
 * https://buyavowel.boards.net/page/compendiumindex
 * 
 * Structured data with season, episode, date, category, and round type
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

interface ScrapedPuzzle {
  phrase: string;
  category: string;
  date: string;
  episode?: string;
  round: string;
  season: number;
}

// Season URLs - compendium1 through compendium43
const SEASONS: { season: number; url: string; years: string }[] = [
  { season: 1, url: 'https://buyavowel.boards.net/page/compendium1', years: '1983-1984' },
  { season: 2, url: 'https://buyavowel.boards.net/page/compendium2', years: '1984-1985' },
  { season: 3, url: 'https://buyavowel.boards.net/page/compendium3', years: '1985-1986' },
  { season: 4, url: 'https://buyavowel.boards.net/page/compendium4', years: '1986-1987' },
  { season: 5, url: 'https://buyavowel.boards.net/page/compendium5', years: '1987-1988' },
  { season: 6, url: 'https://buyavowel.boards.net/page/compendium6', years: '1988-1989' },
  { season: 7, url: 'https://buyavowel.boards.net/page/compendium7', years: '1989-1990' },
  { season: 8, url: 'https://buyavowel.boards.net/page/compendium8', years: '1990-1991' },
  { season: 9, url: 'https://buyavowel.boards.net/page/compendium9', years: '1991-1992' },
  { season: 10, url: 'https://buyavowel.boards.net/page/compendium10', years: '1992-1993' },
  { season: 11, url: 'https://buyavowel.boards.net/page/compendium11', years: '1993-1994' },
  { season: 12, url: 'https://buyavowel.boards.net/page/compendium12', years: '1994-1995' },
  { season: 13, url: 'https://buyavowel.boards.net/page/compendium13', years: '1995-1996' },
  { season: 14, url: 'https://buyavowel.boards.net/page/compendium14', years: '1996-1997' },
  { season: 15, url: 'https://buyavowel.boards.net/page/compendium15', years: '1997-1998' },
  { season: 16, url: 'https://buyavowel.boards.net/page/compendium16', years: '1998-1999' },
  { season: 17, url: 'https://buyavowel.boards.net/page/compendium17', years: '1999-2000' },
  { season: 18, url: 'https://buyavowel.boards.net/page/compendium18', years: '2000-2001' },
  { season: 19, url: 'https://buyavowel.boards.net/page/compendium19', years: '2001-2002' },
  { season: 20, url: 'https://buyavowel.boards.net/page/compendium20', years: '2002-2003' },
  { season: 21, url: 'https://buyavowel.boards.net/page/compendium21', years: '2003-2004' },
  { season: 22, url: 'https://buyavowel.boards.net/page/compendium22', years: '2004-2005' },
  { season: 23, url: 'https://buyavowel.boards.net/page/compendium23', years: '2005-2006' },
  { season: 24, url: 'https://buyavowel.boards.net/page/compendium24', years: '2006-2007' },
  { season: 25, url: 'https://buyavowel.boards.net/page/compendium25', years: '2007-2008' },
  { season: 26, url: 'https://buyavowel.boards.net/page/compendium26', years: '2008-2009' },
  { season: 27, url: 'https://buyavowel.boards.net/page/compendium27', years: '2009-2010' },
  { season: 28, url: 'https://buyavowel.boards.net/page/compendium28', years: '2010-2011' },
  { season: 29, url: 'https://buyavowel.boards.net/page/compendium29', years: '2011-2012' },
  { season: 30, url: 'https://buyavowel.boards.net/page/compendium30', years: '2012-2013' },
  { season: 31, url: 'https://buyavowel.boards.net/page/compendium31', years: '2013-2014' },
  { season: 32, url: 'https://buyavowel.boards.net/page/compendium32', years: '2014-2015' },
  { season: 33, url: 'https://buyavowel.boards.net/page/compendium33', years: '2015-2016' },
  { season: 34, url: 'https://buyavowel.boards.net/page/compendium34', years: '2016-2017' },
  { season: 35, url: 'https://buyavowel.boards.net/page/compendium35', years: '2017-2018' },
  { season: 36, url: 'https://buyavowel.boards.net/page/compendium36', years: '2018-2019' },
  { season: 37, url: 'https://buyavowel.boards.net/page/compendium37', years: '2019-2020' },
  { season: 38, url: 'https://buyavowel.boards.net/page/compendium38', years: '2020-2021' },
  { season: 39, url: 'https://buyavowel.boards.net/page/compendium39', years: '2021-2022' },
  { season: 40, url: 'https://buyavowel.boards.net/page/compendium40', years: '2022-2023' },
  { season: 41, url: 'https://buyavowel.boards.net/page/compendium41', years: '2023-2024' },
  { season: 42, url: 'https://buyavowel.boards.net/page/compendium42', years: '2024-2025' },
  { season: 43, url: 'https://buyavowel.boards.net/page/compendium43', years: '2025-2026' },
];

/**
 * Map round codes to round types
 */
function parseRoundType(round: string): 'MAIN' | 'TOSSUP' | 'BONUS' {
  const r = round.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (r === 'BR') return 'BONUS';
  if (r.startsWith('T')) return 'TOSSUP';
  return 'MAIN';
}

/**
 * Parse HTML to extract puzzles
 * Uses text-based pattern matching since the HTML structure is messy
 */
function parseTableRows(html: string, season: number): ScrapedPuzzle[] {
  const puzzles: ScrapedPuzzle[] = [];
  
  // Strip HTML tags and decode entities
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
  
  // Pattern: PUZZLE CATEGORY DATE EP# ROUND
  // Example: SPAIN & PORTUGAL On the Map 9/11/23 #7816 T1
  // Puzzle is all caps with punctuation, Category is mixed case
  // Round patterns: T1-T5, R1-R5, R1*-R5*, BR, with optional ^
  
  // Split by date + episode + round pattern, then extract puzzle and category from preceding text
  const entryPattern = /([A-Z][A-Z0-9\s&'\-.,!?:;]+?)\s+([A-Z][a-z][A-Za-z\s&'?]+?)\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+#(\d+)\s+(T[1-5]|R[1-5]\*?|BR)\^?(?=\s)/g;
  
  let match;
  while ((match = entryPattern.exec(text)) !== null) {
    const [, puzzle, category, date, episode, round] = match;
    
    // Clean up puzzle phrase
    const cleanPuzzle = puzzle.trim();
    const cleanCategory = category.trim();
    
    // Skip headers and invalid entries
    if (cleanPuzzle === 'PUZZLE' || cleanCategory.toUpperCase() === 'CATEGORY') continue;
    if (cleanPuzzle.includes('SEASON')) continue;
    if (cleanPuzzle.length < 3) continue;
    
    puzzles.push({
      phrase: cleanPuzzle,
      category: cleanCategory,
      date: date,
      episode: episode,
      round: round.replace(/[^A-Z0-9]/gi, ''),
      season,
    });
  }
  
  return puzzles;
}

/**
 * Fetch HTML using curl (more reliable with some sites)
 */
async function fetchWithCurl(url: string): Promise<string | null> {
  const { execSync } = await import('child_process');
  
  try {
    const result = execSync(
      `curl -sL "${url}" -H "Accept: text/html" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    return result;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch and parse a single season page
 */
async function fetchSeason(season: number, url: string): Promise<ScrapedPuzzle[]> {
  console.log(`Fetching Season ${season} from ${url}...`);
  
  try {
    const html = await fetchWithCurl(url);
    
    if (!html) {
      console.warn(`  Failed to fetch`);
      return [];
    }
    
    const puzzles = parseTableRows(html, season);
    
    console.log(`  Found ${puzzles.length} puzzles`);
    return puzzles;
  } catch (err) {
    console.error(`  Error fetching season ${season}:`, err);
    return [];
  }
}

/**
 * Scrape all seasons and save to JSON files
 */
export async function scrapeAllSeasons(
  outDir: string,
  seasonRange?: { start: number; end: number },
  delayMs = 1000
): Promise<void> {
  mkdirSync(outDir, { recursive: true });
  
  const seasons = seasonRange
    ? SEASONS.filter(s => s.season >= seasonRange.start && s.season <= seasonRange.end)
    : SEASONS;
  
  const allPuzzles: ScrapedPuzzle[] = [];
  
  for (const { season, url, years } of seasons) {
    const puzzles = await fetchSeason(season, url);
    
    if (puzzles.length > 0) {
      // Save individual season file
      const seasonFile = resolve(outDir, `season_${season.toString().padStart(2, '0')}.json`);
      const seasonData = {
        season,
        years,
        url,
        puzzle_count: puzzles.length,
        puzzles: puzzles.map(p => ({
          phrase: p.phrase,
          category: p.category,
          date: p.date,
          round: p.round,
          round_type: parseRoundType(p.round),
        })),
      };
      
      writeFileSync(seasonFile, JSON.stringify(seasonData, null, 2));
      console.log(`  Saved to ${seasonFile}`);
      
      allPuzzles.push(...puzzles);
    }
    
    // Be nice to the server
    if (delayMs > 0) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  
  // Save combined file
  const combinedFile = resolve(outDir, 'all_seasons.json');
  writeFileSync(combinedFile, JSON.stringify({
    total_puzzles: allPuzzles.length,
    seasons_scraped: seasons.length,
    puzzles: allPuzzles.map(p => ({
      phrase: p.phrase,
      category: p.category,
      date: p.date,
      round: p.round,
      round_type: parseRoundType(p.round),
      season: p.season,
    })),
  }, null, 2));
  
  console.log(`\nTotal: ${allPuzzles.length} puzzles saved to ${combinedFile}`);
}

export { SEASONS, ScrapedPuzzle, parseRoundType };
