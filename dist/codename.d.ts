import type { getOctokit } from '@actions/github';
import type { CodenameTheme } from './types';
export declare function generateCodename(theme: CodenameTheme, existingNames: string[], customWords?: string[]): string;
export declare function getExistingReleaseNames(octokit: ReturnType<typeof getOctokit>, owner: string, repo: string): Promise<string[]>;
