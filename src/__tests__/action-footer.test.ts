import { describe, expect, it } from 'vitest'
import { ACTION_REPO, ACTION_REPO_URL, buildActionFooter } from '../action-footer'

describe('buildActionFooter', () => {
	it('returns footer with horizontal rule and created-by line', () => {
		const footer = buildActionFooter()
		expect(footer).toMatch(/^---\n\nCreated by /)
	})

	it('includes repo link with correct URL', () => {
		const footer = buildActionFooter()
		expect(footer).toContain(`[${ACTION_REPO}](${ACTION_REPO_URL})`)
	})

	it('includes version link to releases', () => {
		const footer = buildActionFooter()
		expect(footer).toMatch(/@\[\d+\.\d+\.\d+\]\(https:\/\/github\.com\/creo-team\/action-release\/releases\/tag\/[\d.]+\)/)
	})
})
