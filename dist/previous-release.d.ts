import type * as github from '@actions/github';
import type { PreviousReleaseStrategy } from './types';
type Octokit = ReturnType<typeof github.getOctokit>;
export declare function findPreviousTag(octokit: Octokit, owner: string, repo: string, strategy: PreviousReleaseStrategy, options?: {
    matchPattern?: string;
    specificTag?: string;
    tagPrefix?: string;
}): Promise<null | string>;
export {};
