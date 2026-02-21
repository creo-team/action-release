import { describe, expect, it } from 'vitest'
import { detectBumpFromMessages, detectConventionalBump, detectKeywordBump, highestBump } from '../bump'

describe('detectConventionalBump', () => {
	it('detects feat as minor', () => {
		expect(detectConventionalBump('feat: add new feature')).toBe('minor')
	})

	it('detects feat with scope as minor', () => {
		expect(detectConventionalBump('feat(auth): add login')).toBe('minor')
	})

	it('detects fix as patch', () => {
		expect(detectConventionalBump('fix: resolve bug')).toBe('patch')
	})

	it('detects breaking change bang as major', () => {
		expect(detectConventionalBump('feat!: breaking change')).toBe('major')
	})

	it('detects BREAKING CHANGE footer as major', () => {
		expect(detectConventionalBump('feat: something\n\nBREAKING CHANGE: removed api')).toBe('major')
	})

	it('returns none for non-conventional messages', () => {
		expect(detectConventionalBump('updated readme')).toBe('none')
		expect(detectConventionalBump('misc changes')).toBe('none')
	})

	it('handles scoped breaking change', () => {
		expect(detectConventionalBump('refactor(api)!: rewrite endpoints')).toBe('major')
	})
})

describe('detectKeywordBump', () => {
	const major = ['BREAKING', 'major']
	const minor = ['feat', 'feature']
	const patch = ['fix', 'bug']

	it('detects major keywords', () => {
		expect(detectKeywordBump('BREAKING change here', major, minor, patch)).toBe('major')
		expect(detectKeywordBump('this is a major update', major, minor, patch)).toBe('major')
	})

	it('detects minor keywords', () => {
		expect(detectKeywordBump('add new feature', major, minor, patch)).toBe('minor')
		expect(detectKeywordBump('feat: something', major, minor, patch)).toBe('minor')
	})

	it('detects patch keywords', () => {
		expect(detectKeywordBump('fix a bug', major, minor, patch)).toBe('patch')
		expect(detectKeywordBump('bug report resolved', major, minor, patch)).toBe('patch')
	})

	it('returns none when no keywords match', () => {
		expect(detectKeywordBump('updated docs', major, minor, patch)).toBe('none')
		expect(detectKeywordBump('refactored code', major, minor, patch)).toBe('none')
	})

	it('is case insensitive', () => {
		expect(detectKeywordBump('breaking change', ['BREAKING'], [], [])).toBe('major')
		expect(detectKeywordBump('FEAT added', [], ['feat'], [])).toBe('minor')
	})

	it('prioritizes major over minor', () => {
		expect(detectKeywordBump('BREAKING feat', major, minor, patch)).toBe('major')
	})
})

describe('highestBump', () => {
	it('returns major when present', () => {
		expect(highestBump(['patch', 'minor', 'major'])).toBe('major')
	})

	it('returns minor when no major', () => {
		expect(highestBump(['patch', 'minor', 'patch'])).toBe('minor')
	})

	it('returns patch when only patches', () => {
		expect(highestBump(['patch', 'patch'])).toBe('patch')
	})

	it('returns none for empty array', () => {
		expect(highestBump([])).toBe('none')
	})

	it('returns none when all none', () => {
		expect(highestBump(['none', 'none'])).toBe('none')
	})
})

describe('detectBumpFromMessages', () => {
	const major = ['BREAKING CHANGE', 'major']
	const minor = ['feat', 'feature']
	const patch = ['fix', 'bug', 'chore']

	it('detects from conventional commits', () => {
		const result = detectBumpFromMessages(['feat: new thing', 'fix: old thing'], major, minor, patch)
		expect(result.type).toBe('minor')
	})

	it('detects from keywords when not conventional', () => {
		const result = detectBumpFromMessages(['added a new feature'], major, minor, patch)
		expect(result.type).toBe('minor')
	})

	it('returns none when nothing matches', () => {
		const result = detectBumpFromMessages(['updated readme', 'minor tweak'], ['BREAKING'], ['feature'], ['bugfix'])
		expect(result.type).toBe('none')
	})

	it('prefers highest bump across messages', () => {
		const result = detectBumpFromMessages(['fix: small fix', 'feat!: big breaking change'], major, minor, patch)
		expect(result.type).toBe('major')
	})

	it('includes reason in result', () => {
		const result = detectBumpFromMessages(['feat: add button'], major, minor, patch)
		expect(result.reason).toContain('conventional commit')
		expect(result.reason).toContain('minor')
	})

	it('handles empty messages', () => {
		const result = detectBumpFromMessages([], major, minor, patch)
		expect(result.type).toBe('none')
		expect(result.reason).toContain('no keywords')
	})
})
