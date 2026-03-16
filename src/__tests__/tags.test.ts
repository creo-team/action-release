import { describe, expect, it } from 'vitest'
import {
	buildCompareUrl,
	formatMajorTag,
	formatMinorTag,
	formatTag,
	getTagsForStrategy,
	stripPrefix,
	stripSuffix,
} from '../tags'
import type { SemVer } from '../types'

const version: SemVer = { major: 1, minor: 2, patch: 3 }

describe('formatTag', () => {
	it('formats with v prefix', () => {
		expect(formatTag(version, 'v')).toBe('v1.2.3')
	})

	it('formats without prefix', () => {
		expect(formatTag(version, '')).toBe('1.2.3')
	})

	it('formats with custom prefix', () => {
		expect(formatTag(version, 'release-')).toBe('release-1.2.3')
	})

	it('formats with prerelease', () => {
		const pre: SemVer = { major: 1, minor: 0, patch: 0, prerelease: 'beta.2' }
		expect(formatTag(pre, 'v')).toBe('v1.0.0-beta.2')
	})

	it('formats with suffix', () => {
		expect(formatTag(version, '', '-app')).toBe('1.2.3-app')
	})

	it('formats with prefix and suffix', () => {
		expect(formatTag(version, 'v', '-rc')).toBe('v1.2.3-rc')
	})
})

describe('formatMajorTag', () => {
	it('formats major tag', () => {
		expect(formatMajorTag(version, 'v', '')).toBe('v1')
	})

	it('formats without prefix', () => {
		expect(formatMajorTag(version, '', '')).toBe('1')
	})

	it('formats with suffix', () => {
		expect(formatMajorTag(version, '', '-app')).toBe('1-app')
	})
})

describe('formatMinorTag', () => {
	it('formats minor tag', () => {
		expect(formatMinorTag(version, 'v', '')).toBe('v1.2')
	})

	it('formats without prefix', () => {
		expect(formatMinorTag(version, '', '')).toBe('1.2')
	})

	it('formats with suffix', () => {
		expect(formatMinorTag(version, '', '-app')).toBe('1.2-app')
	})
})

describe('getTagsForStrategy', () => {
	it('returns only full tag for "full" strategy', () => {
		expect(getTagsForStrategy(version, 'v', 'full')).toEqual(['v1.2.3'])
	})

	it('returns all tags for "all" strategy', () => {
		expect(getTagsForStrategy(version, 'v', 'all')).toEqual(['v1.2.3', 'v1.2', 'v1'])
	})

	it('returns full and minor for "full-and-minor" strategy', () => {
		expect(getTagsForStrategy(version, 'v', 'full-and-minor')).toEqual(['v1.2.3', 'v1.2'])
	})

	it('works with empty prefix', () => {
		expect(getTagsForStrategy(version, '', 'all')).toEqual(['1.2.3', '1.2', '1'])
	})

	it('handles prerelease with full strategy', () => {
		const pre: SemVer = { major: 1, minor: 0, patch: 0, prerelease: 'rc.1' }
		expect(getTagsForStrategy(pre, 'v', 'full')).toEqual(['v1.0.0-rc.1'])
	})

	it('applies suffix to all tags', () => {
		expect(getTagsForStrategy(version, '', 'all', '-app')).toEqual(['1.2.3-app', '1.2-app', '1-app'])
	})

	it('applies prefix and suffix together', () => {
		expect(getTagsForStrategy(version, 'v', 'full', '-rc')).toEqual(['v1.2.3-rc'])
	})
})

describe('stripPrefix', () => {
	it('strips v prefix', () => {
		expect(stripPrefix('v1.2.3', 'v')).toBe('1.2.3')
	})

	it('returns original when no prefix match', () => {
		expect(stripPrefix('1.2.3', 'v')).toBe('1.2.3')
	})

	it('strips custom prefix', () => {
		expect(stripPrefix('release-1.0.0', 'release-')).toBe('1.0.0')
	})
})

describe('stripSuffix', () => {
	it('strips suffix', () => {
		expect(stripSuffix('1.2.3-app', '-app')).toBe('1.2.3')
	})

	it('returns original when no suffix match', () => {
		expect(stripSuffix('1.2.3', '-app')).toBe('1.2.3')
	})

	it('returns original when suffix is empty', () => {
		expect(stripSuffix('1.2.3', '')).toBe('1.2.3')
	})
})

describe('floating tags (all strategy, no prefix)', () => {
	it('produces patch, minor, and major tags for a new project', () => {
		const v: SemVer = { major: 1, minor: 0, patch: 0 }
		expect(getTagsForStrategy(v, '', 'all')).toEqual(['1.0.0', '1.0', '1'])
	})

	it('produces patch, minor, and major tags for later versions', () => {
		const v: SemVer = { major: 2, minor: 3, patch: 1 }
		expect(getTagsForStrategy(v, '', 'all')).toEqual(['2.3.1', '2.3', '2'])
	})
})

describe('buildCompareUrl', () => {
	it('builds correct compare URL', () => {
		expect(buildCompareUrl('owner', 'repo', 'v1.0.0', 'v1.1.0')).toBe(
			'https://github.com/owner/repo/compare/v1.0.0...v1.1.0',
		)
	})
})
