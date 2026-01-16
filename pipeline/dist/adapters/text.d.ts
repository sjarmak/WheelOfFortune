import { Adapter } from './index.js';
export declare class TextAdapter implements Adapter {
    parse(filePath: string): Promise<any>;
}
