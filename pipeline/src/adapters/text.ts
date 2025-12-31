import fs from 'fs-extra';
import { Adapter } from './index.js';

export class TextAdapter implements Adapter {
  async parse(filePath: string) {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    return lines
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Assume format "CATEGORY: PHRASE" or just "PHRASE" (if no colon)
        let category = 'OTHER';
        let phrase = line;
        
        if (line.includes(':')) {
          const parts = line.split(':');
          if (parts.length === 2) {
             category = parts[0].trim();
             phrase = parts[1].trim();
          }
        }

        return {
          phrase,
          category,
          round_type: 'MAIN' as const,
          source: {
            type: 'text_file',
            name: 'imported_text',
            path: filePath
          }
        };
      });
  }
}
