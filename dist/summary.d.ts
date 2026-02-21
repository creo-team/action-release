import type { TemplateVariables } from './types';
interface SummaryOptions {
    changelog?: string;
    codename?: string;
    created: boolean;
    dryRun: boolean;
    llmSummary?: string;
    tags: string[];
    uploadedAssets?: string[];
}
export declare function writeStepSummary(variables: TemplateVariables, options: SummaryOptions): Promise<void>;
export {};
