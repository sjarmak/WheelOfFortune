import { Category } from '../schema.js';
/**
 * Map a category string to canonical category
 * Returns [canonicalCategory, originalIfMapped]
 */
export declare function mapCategory(input: string | undefined): {
    category: Category;
    original?: string;
};
