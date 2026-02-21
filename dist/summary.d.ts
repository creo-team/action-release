import { TemplateVariables } from './types';
export declare function writeStepSummary(variables: TemplateVariables, options: {
    dryRun: boolean;
    created: boolean;
    tags: string[];
    changelog?: string;
    llmSummary?: string;
    codename?: string;
    uploadedAssets?: string[];
}): Promise<void>;
