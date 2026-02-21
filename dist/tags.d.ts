import type { SemVer, TagStrategy } from './types';
export declare function buildCompareUrl(owner: string, repo: string, previousTag: string, newTag: string): string;
export declare function formatMajorTag(version: SemVer, prefix: string): string;
export declare function formatMinorTag(version: SemVer, prefix: string): string;
export declare function formatTag(version: SemVer, prefix: string): string;
export declare function getTagsForStrategy(version: SemVer, prefix: string, strategy: TagStrategy): string[];
export declare function stripPrefix(tag: string, prefix: string): string;
