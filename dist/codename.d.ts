import { CodenameTheme } from './types';
export declare function generateCodename(theme: CodenameTheme, existingNames: string[], customWords?: string[]): string;
export declare function getExistingReleaseNames(octokit: ReturnType<typeof import('@actions/github').getOctokit>, owner: string, repo: string): Promise<string[]>;
