import { CANONICAL_CATEGORIES } from '../schema.js';
/**
 * Category variant mappings to canonical categories
 */
const CATEGORY_MAPPINGS = {
    // PHRASE variants
    'phrase': 'PHRASE',
    'phrases': 'PHRASE',
    'quotation': 'PHRASE',
    'slang': 'PHRASE',
    'rhyme time': 'PHRASE',
    'rhyme': 'PHRASE',
    // FOOD_AND_DRINK variants
    'food & drink': 'FOOD_AND_DRINK',
    'food and drink': 'FOOD_AND_DRINK',
    'food': 'FOOD_AND_DRINK',
    'drink': 'FOOD_AND_DRINK',
    'food/drink': 'FOOD_AND_DRINK',
    // PLACE variants
    'place': 'PLACE',
    'places': 'PLACE',
    'landmark': 'PLACE',
    'landmarks': 'PLACE',
    // WHAT_ARE_YOU_DOING variants
    'what are you doing': 'WHAT_ARE_YOU_DOING',
    'what are you doing?': 'WHAT_ARE_YOU_DOING',
    'doing': 'WHAT_ARE_YOU_DOING',
    // BEFORE_AND_AFTER variants
    'before & after': 'BEFORE_AND_AFTER',
    'before and after': 'BEFORE_AND_AFTER',
    // SAME_NAME variants
    'same name': 'SAME_NAME',
    // TITLE variants
    'title': 'TITLE',
    'titles': 'TITLE',
    'song title': 'TITLE',
    'song': 'TITLE',
    'movie title': 'TITLE',
    'movie': 'TITLE',
    'book title': 'TITLE',
    'book': 'TITLE',
    'tv show': 'TITLE',
    'show title': 'TITLE',
    // PERSON variants
    'person': 'PERSON',
    'persons': 'PERSON',
    'people': 'PERSON',
    'proper name': 'PERSON',
    'name': 'PERSON',
    // EVENT variants
    'event': 'EVENT',
    'events': 'EVENT',
    'happening': 'EVENT',
    // AROUND_THE_HOUSE variants
    'around the house': 'AROUND_THE_HOUSE',
    'in the kitchen': 'AROUND_THE_HOUSE',
    'household': 'AROUND_THE_HOUSE',
    // THING variants
    'thing': 'THING',
    'things': 'THING',
    'object': 'THING',
    'objects': 'THING',
    // OCCUPATION variants
    'occupation': 'OCCUPATION',
    'occupations': 'OCCUPATION',
    'job': 'OCCUPATION',
    'jobs': 'OCCUPATION',
    'profession': 'OCCUPATION',
    // LIVING_THING variants
    'living thing': 'LIVING_THING',
    'living things': 'LIVING_THING',
    'animal': 'LIVING_THING',
    'animals': 'LIVING_THING',
    // ON_THE_MAP variants
    'on the map': 'ON_THE_MAP',
    // FICTIONAL_CHARACTER variants
    'fictional character': 'FICTIONAL_CHARACTER',
    'fictional characters': 'FICTIONAL_CHARACTER',
    'character': 'FICTIONAL_CHARACTER',
    // OTHER
    'other': 'OTHER',
    'miscellaneous': 'OTHER',
    'misc': 'OTHER',
};
/**
 * Normalize a category string
 */
function normalizeString(input) {
    return input
        .toLowerCase()
        .replace(/[_\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
/**
 * Map a category string to canonical category
 * Returns [canonicalCategory, originalIfMapped]
 */
export function mapCategory(input) {
    if (!input || input.trim() === '') {
        return { category: 'OTHER' };
    }
    const normalized = normalizeString(input);
    // Check direct mapping
    if (normalized in CATEGORY_MAPPINGS) {
        return { category: CATEGORY_MAPPINGS[normalized] };
    }
    // Check if it's already a canonical category (case-insensitive)
    const upperInput = input.toUpperCase().replace(/[\s\-]/g, '_');
    if (CANONICAL_CATEGORIES.includes(upperInput)) {
        return { category: upperInput };
    }
    // Unknown category -> OTHER with original stored
    return { category: 'OTHER', original: input };
}
