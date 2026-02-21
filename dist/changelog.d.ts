interface ParsedCommit {
    breaking: boolean;
    description: string;
    hash?: string;
    scope?: string;
    type: string;
}
export declare function formatRawChanges(commitMessages: string[], commitHashes?: string[]): string;
export declare function generateChangelog(commitMessages: string[], commitHashes?: string[]): string;
export declare function parseCommitMessage(message: string): null | ParsedCommit;
export {};
