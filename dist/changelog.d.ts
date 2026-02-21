interface ParsedCommit {
    type: string;
    scope?: string;
    description: string;
    breaking: boolean;
    hash?: string;
}
export declare function parseCommitMessage(message: string): ParsedCommit | null;
export declare function generateChangelog(commitMessages: string[], commitHashes?: string[]): string;
export declare function formatRawChanges(commitMessages: string[], commitHashes?: string[]): string;
export {};
