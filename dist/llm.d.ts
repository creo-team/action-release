import type { LlmProvider } from './types';
export interface LlmInput {
    commitMessages: string[];
    diff?: string;
    newTag: string;
    previousTag: string;
    repo: string;
}
export interface LlmOptions {
    apiKey: string;
    maxTokens: number;
    model?: string;
    provider: LlmProvider;
    systemPrompt?: string;
}
export declare function generateLlmReleaseNotes(options: LlmOptions, input: LlmInput): Promise<string>;
