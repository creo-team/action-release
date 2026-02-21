import type { BumpResult, BumpType } from './types';
export declare function detectBumpFromMessages(messages: string[], majorKeywords: string[], minorKeywords: string[], patchKeywords: string[]): BumpResult;
export declare function detectConventionalBump(message: string): BumpType;
export declare function detectKeywordBump(text: string, majorKeywords: string[], minorKeywords: string[], patchKeywords: string[]): BumpType;
export declare function highestBump(bumps: BumpType[]): BumpType;
