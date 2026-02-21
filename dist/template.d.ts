import { TemplateVariables } from './types';
export declare function renderTemplate(template: string, variables: TemplateVariables): string;
export declare function buildTemplateVariables(partial: Partial<TemplateVariables>): TemplateVariables;
