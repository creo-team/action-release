import type { TemplateVariables } from './types';
interface MarketplaceHint {
    editUrl: string;
}
interface SummaryOptions {
    changelog?: string;
    codename?: string;
    created: boolean;
    dryRun: boolean;
    llmSummary?: string;
    marketplace?: MarketplaceHint;
    tags: string[];
    uploadedAssets?: string[];
}
export declare function writeStepSummary(variables: TemplateVariables, options: SummaryOptions): Promise<void>;
export declare function buildSummaryMarkdown(variables: TemplateVariables, options: SummaryOptions): string;
export {};
