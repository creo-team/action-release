import type { SemVer, TagStrategy } from './types'

export function buildCompareUrl(owner: string, repo: string, previousTag: string, newTag: string): string {
	return `https://github.com/${owner}/${repo}/compare/${previousTag}...${newTag}`
}

export function formatMajorTag(version: SemVer, prefix: string, suffix: string): string {
	return `${prefix}${version.major}${suffix}`
}

export function formatMinorTag(version: SemVer, prefix: string, suffix: string): string {
	return `${prefix}${version.major}.${version.minor}${suffix}`
}

export function formatTag(version: SemVer, prefix: string, suffix = ''): string {
	const base = `${version.major}.${version.minor}.${version.patch}`
	const versionStr = version.prerelease ? `${base}-${version.prerelease}` : base

	return `${prefix}${versionStr}${suffix}`
}

export function getTagsForStrategy(version: SemVer, prefix: string, strategy: TagStrategy, suffix = ''): string[] {
	const fullTag = formatTag(version, prefix, suffix)

	switch (strategy) {
		case 'all':
			return [fullTag, formatMinorTag(version, prefix, suffix), formatMajorTag(version, prefix, suffix)]
		case 'full':
			return [fullTag]
		case 'full-and-minor':
			return [fullTag, formatMinorTag(version, prefix, suffix)]
	}
}

export function stripPrefix(tag: string, prefix: string): string {
	return tag.startsWith(prefix) ? tag.slice(prefix.length) : tag
}

export function stripSuffix(tag: string, suffix: string): string {
	return suffix && tag.endsWith(suffix) ? tag.slice(0, -suffix.length) : tag
}
