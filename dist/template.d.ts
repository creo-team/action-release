import type { TemplateVariables } from './types';
export declare function buildTemplateVariables(partial: Partial<TemplateVariables>): TemplateVariables;
export declare function renderTemplate(template: string, variables: TemplateVariables): string;
