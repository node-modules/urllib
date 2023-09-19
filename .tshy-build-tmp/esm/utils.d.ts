import type { FixJSONCtlChars } from './Request.js';
export declare function parseJSON(data: string, fixJSONCtlChars?: FixJSONCtlChars): string;
export declare function sleep(ms: number): Promise<void>;
export declare function digestAuthHeader(method: string, uri: string, wwwAuthenticate: string, userpass: string): string;
export declare function globalId(category: string): number;
export declare function performanceTime(startTime: number, now?: number): number;
export declare function isReadable(stream: any): boolean;
