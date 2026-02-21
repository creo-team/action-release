import type * as github from '@actions/github';
export interface UploadAssetsOptions {
    failOnUnmatched: boolean;
    overwrite: boolean;
    owner: string;
    patterns: string;
    releaseId: number;
    repo: string;
    workingDirectory: string;
}
type Octokit = ReturnType<typeof github.getOctokit>;
export declare function uploadAssets(octokit: Octokit, options: UploadAssetsOptions): Promise<string[]>;
export {};
