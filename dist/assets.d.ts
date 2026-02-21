import * as github from '@actions/github';
type Octokit = ReturnType<typeof github.getOctokit>;
export interface UploadAssetsOptions {
    owner: string;
    repo: string;
    releaseId: number;
    patterns: string;
    workingDirectory: string;
    overwrite: boolean;
    failOnUnmatched: boolean;
}
export declare function uploadAssets(octokit: Octokit, options: UploadAssetsOptions): Promise<string[]>;
export {};
