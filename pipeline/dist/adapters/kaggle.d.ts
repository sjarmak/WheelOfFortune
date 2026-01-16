import { Adapter } from './index.js';
export declare class KaggleAdapter implements Adapter {
    parse(filePath: string): Promise<{
        phrase: any;
        category: any;
        round_type: "MAIN" | "TOSSUP" | "BONUS";
        source: {
            type: string;
            name: string;
            path: string;
        };
    }[]>;
}
