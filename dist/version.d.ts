import { SemVer } from './types';
export declare function parseSemVer(version: string): SemVer | null;
export declare function formatSemVer(version: SemVer): string;
export declare function isValidSemVer(version: string): boolean;
export declare function bumpVersion(current: SemVer, bump: 'major' | 'minor' | 'patch'): SemVer;
export declare function applyChannel(version: SemVer, channel: string, prereleaseNumber: number): SemVer;
export declare function readVersionFromPackageJson(path: string): string;
export declare function readVersionFromFile(filePath: string, pattern: string): string;
export declare function compareSemVer(a: SemVer, b: SemVer): number;
