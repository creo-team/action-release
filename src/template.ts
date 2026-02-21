import type { TemplateVariables } from './types'

// ============================================================================
// Mustache-Style Template Rendering
// ============================================================================

const VARIABLE_REGEX = /\{\{\s*(\w+)\s*\}\}/g

export function buildTemplateVariables(partial: Partial<TemplateVariables>): TemplateVariables {
	return {
		actor: '',
		branch: '',
		changelog: '',
		changes: '',
		codename: '',
		commit: '',
		commit_short: '',
		compare_url: '',
		date: '',
		llm_summary: '',
		major: '',
		minor: '',
		owner: '',
		patch: '',
		previous_tag: '',
		release_name: '',
		release_url: '',
		repo: '',
		tag: '',
		version: '',
		...partial,
	}
}

// ============================================================================
// Template Variable Construction
// ============================================================================

export function renderTemplate(template: string, variables: TemplateVariables): string {
	return template.replace(VARIABLE_REGEX, (_match, key: string) => {
		const value = variables[key as keyof TemplateVariables]

		return value !== undefined ? value : ''
	})
}
