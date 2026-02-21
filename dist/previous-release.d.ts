import * as github from '@actions/github';
import { PreviousReleaseStrategy } from './types';
type Octokit = ReturnType<typeof github.getOctokit>;
export declare function findPreviousTag(octokit: Octokit, owner: string, repo: string, strategy: PreviousReleaseStrategy, options?: {
    specificTag?: string;
    matchPattern?: string;
    tagPrefix?: string;
}): Promise<string | null>;
export {};
