import { TemplateVariables } from './types';

// ============================================================================
// Mustache-Style Template Rendering
// ============================================================================

const VARIABLE_REGEX = /\{\{\s*(\w+)\s*\}\}/g;

export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  return template.replace(VARIABLE_REGEX, (_match, key: string) => {
    const value = variables[key as keyof TemplateVariables];
    return value !== undefined ? value : '';
  });
}

// ============================================================================
// Template Variable Construction
// ============================================================================

export function buildTemplateVariables(
  partial: Partial<TemplateVariables>
): TemplateVariables {
  return {
    tag: '',
    version: '',
    major: '',
    minor: '',
    patch: '',
    commit: '',
    commit_short: '',
    previous_tag: '',
    compare_url: '',
    changes: '',
    changelog: '',
    llm_summary: '',
    codename: '',
    date: '',
    repo: '',
    owner: '',
    branch: '',
    actor: '',
    release_url: '',
    release_name: '',
    ...partial,
  };
}
