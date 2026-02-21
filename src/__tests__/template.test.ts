import { describe, expect, it } from 'vitest'
import { buildTemplateVariables, renderTemplate } from '../template'
import type { TemplateVariables } from '../types'

const baseVars: TemplateVariables = buildTemplateVariables({
	actor: 'octocat',
	branch: 'main',
	commit: 'abc1234567890',
	commit_short: 'abc1234',
	compare_url: 'https://github.com/owner/repo/compare/v1.2.2...v1.2.3',
	date: '2025-06-15',
	major: '1',
	minor: '2',
	owner: 'owner',
	patch: '3',
	previous_tag: 'v1.2.2',
	repo: 'owner/repo',
	tag: 'v1.2.3',
	version: '1.2.3',
})

describe('renderTemplate', () => {
	it('replaces single variable', () => {
		expect(renderTemplate('Release {{tag}}', baseVars)).toBe('Release v1.2.3')
	})

	it('replaces multiple variables', () => {
		const template = '{{tag}} from {{commit_short}} on {{date}}'
		expect(renderTemplate(template, baseVars)).toBe('v1.2.3 from abc1234 on 2025-06-15')
	})

	it('handles variables with spaces in braces', () => {
		expect(renderTemplate('{{ tag }}', baseVars)).toBe('v1.2.3')
		expect(renderTemplate('{{  version  }}', baseVars)).toBe('1.2.3')
	})

	it('replaces unknown variables with empty string', () => {
		expect(renderTemplate('{{unknown_var}}', baseVars)).toBe('')
	})

	it('preserves text without variables', () => {
		expect(renderTemplate('plain text', baseVars)).toBe('plain text')
	})

	it('handles empty template', () => {
		expect(renderTemplate('', baseVars)).toBe('')
	})

	it('renders multiline templates', () => {
		const template = `## Release {{tag}}
Built from {{commit_short}}.
Previous: {{previous_tag}}`

		const result = renderTemplate(template, baseVars)
		expect(result).toContain('## Release v1.2.3')
		expect(result).toContain('Built from abc1234.')
		expect(result).toContain('Previous: v1.2.2')
	})

	it('replaces all occurrences of the same variable', () => {
		expect(renderTemplate('{{tag}} and {{tag}}', baseVars)).toBe('v1.2.3 and v1.2.3')
	})

	it('renders version parts', () => {
		const template = 'v{{major}}.{{minor}}.{{patch}}'
		expect(renderTemplate(template, baseVars)).toBe('v1.2.3')
	})
})

describe('buildTemplateVariables', () => {
	it('provides defaults for all fields', () => {
		const vars = buildTemplateVariables({})
		expect(vars.tag).toBe('')
		expect(vars.version).toBe('')
		expect(vars.commit).toBe('')
		expect(vars.date).toBe('')
	})

	it('merges provided values', () => {
		const vars = buildTemplateVariables({ tag: 'v1.0.0', version: '1.0.0' })
		expect(vars.tag).toBe('v1.0.0')
		expect(vars.version).toBe('1.0.0')
		expect(vars.commit).toBe('')
	})
})
