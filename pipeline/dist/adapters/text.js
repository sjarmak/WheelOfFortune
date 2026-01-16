import fs from 'fs-extra';
export class TextAdapter {
    async parse(filePath) {
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
                round_type: 'MAIN',
                source: {
                    type: 'text_file',
                    name: 'imported_text',
                    path: filePath
                }
            };
        });
    }
}
