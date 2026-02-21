import type { TemplateVariables } from './types';
export declare function writeStepSummary(variables: TemplateVariables, options: {
    changelog?: string;
    codename?: string;
    created: boolean;
    dryRun: boolean;
    llmSummary?: string;
    tags: string[];
    uploadedAssets?: string[];
}): Promise<void>;
