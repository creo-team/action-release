import type * as github from '@actions/github';
import type { IfExistsBehavior, MakeLatest, ReleaseResult } from './types';
export interface CreateReleaseOptions {
    body: string;
    discussionCategory?: string;
    draft: boolean;
    generateReleaseNotes: boolean;
    ifExists: IfExistsBehavior;
    makeLatest: MakeLatest;
    name: string;
    owner: string;
    prerelease: boolean;
    repo: string;
    tag: string;
    targetCommitish?: string;
}
type Octokit = ReturnType<typeof github.getOctokit>;
export declare function createRelease(octokit: Octokit, options: CreateReleaseOptions): Promise<ReleaseResult>;
export declare function createOrUpdateTag(octokit: Octokit, owner: string, repo: string, tag: string, sha: string): Promise<void>;
export {};
