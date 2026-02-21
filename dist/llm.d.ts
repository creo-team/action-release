import { LlmProvider } from './types';
export interface LlmOptions {
    provider: LlmProvider;
    apiKey: string;
    model?: string;
    systemPrompt?: string;
    maxTokens: number;
}
export interface LlmInput {
    commitMessages: string[];
    diff?: string;
    previousTag: string;
    newTag: string;
    repo: string;
}
export declare function generateLlmReleaseNotes(options: LlmOptions, input: LlmInput): Promise<string>;
