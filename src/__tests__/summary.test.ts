import { describe, expect, it } from 'vitest'
import { buildSummaryMarkdown } from '../summary'
import type { TemplateVariables } from '../types'

const baseVars: TemplateVariables = {
	action_release_footer: '',
	actor: 'octocat',
	branch: 'main',
	changelog: '',
	changes: '',
	codename: '',
	commit: 'abc1234567890',
	commit_short: 'abc1234',
	compare_url: 'https://github.com/owner/repo/compare/v1.0.0...v1.1.0',
	date: '2025-02-22',
	llm_summary: '',
	major: '1',
	minor: '1',
	owner: 'owner',
	patch: '0',
	previous_tag: 'v1.0.0',
	release_name: 'v1.1.0',
	release_url: 'https://github.com/owner/repo/releases/tag/v1.1.0',
	repo: 'owner/repo',
	tag: 'v1.1.0',
	version: '1.1.0',
}

describe('buildSummaryMarkdown', () => {
	it('includes marketplace section when created and marketplace hint provided', () => {
		const md = buildSummaryMarkdown(baseVars, {
			created: true,
			dryRun: false,
			marketplace: { editUrl: 'https://github.com/owner/repo/releases/edit/v1.1.0' },
			tags: ['v1.1.0'],
		})
		expect(md).toContain('### Publish to GitHub Marketplace')
		expect(md).toContain('[Edit this release](https://github.com/owner/repo/releases/edit/v1.1.0)')
		expect(md).toContain('Publish this Action to the GitHub Marketplace')
		expect(md).toContain('Marketplace Developer Agreement')
	})

	it('omits marketplace section when dry run', () => {
		const md = buildSummaryMarkdown(baseVars, {
			created: true,
			dryRun: true,
			marketplace: { editUrl: 'https://github.com/owner/repo/releases/edit/v1.1.0' },
			tags: ['v1.1.0'],
		})
		expect(md).not.toContain('### Publish to GitHub Marketplace')
	})

	it('omits marketplace section when release was skipped', () => {
		const md = buildSummaryMarkdown(baseVars, {
			created: false,
			dryRun: false,
			marketplace: { editUrl: 'https://github.com/owner/repo/releases/edit/v1.1.0' },
			tags: ['v1.1.0'],
		})
		expect(md).not.toContain('### Publish to GitHub Marketplace')
	})

	it('omits marketplace section when no marketplace hint', () => {
		const md = buildSummaryMarkdown(baseVars, {
			created: true,
			dryRun: false,
			tags: ['v1.1.0'],
		})
		expect(md).not.toContain('### Publish to GitHub Marketplace')
	})
})
