import * as github from '@actions/github';
import { IfExistsBehavior, MakeLatest, ReleaseResult } from './types';
type Octokit = ReturnType<typeof github.getOctokit>;
export interface CreateReleaseOptions {
    owner: string;
    repo: string;
    tag: string;
    name: string;
    body: string;
    draft: boolean;
    prerelease: boolean;
    makeLatest: MakeLatest;
    targetCommitish?: string;
    discussionCategory?: string;
    generateReleaseNotes: boolean;
    ifExists: IfExistsBehavior;
}
export declare function createRelease(octokit: Octokit, options: CreateReleaseOptions): Promise<ReleaseResult>;
export declare function createOrUpdateTag(octokit: Octokit, owner: string, repo: string, tag: string, sha: string): Promise<void>;
export {};
