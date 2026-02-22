import type * as github from '@actions/github'
import { compareSemVer, parseSemVer } from './version'
import type { PreviousReleaseStrategy } from './types'

type Octokit = ReturnType<typeof github.getOctokit>

export async function findPreviousTag(
	octokit: Octokit,
	owner: string,
	repo: string,
	strategy: PreviousReleaseStrategy,
	options: {
		matchPattern?: string
		specificTag?: string
		tagPrefix?: string
		tagSuffix?: string
	} = {},
): Promise<null | string> {
	switch (strategy) {
		case 'latest-release':
			return findLatestRelease(octokit, owner, repo)
		case 'latest-tag':
			return findLatestSemVerTag(octokit, owner, repo, options.tagPrefix, options.tagSuffix)
		case 'specific-tag':
			return options.specificTag ?? null
		case 'tag-pattern':
			return findTagByPattern(octokit, owner, repo, options.matchPattern ?? '*')
	}
}

async function findLatestRelease(octokit: Octokit, owner: string, repo: string): Promise<null | string> {
	try {
		const { data } = await octokit.rest.repos.getLatestRelease({
			owner,
			repo,
		})

		return data.tag_name
	} catch {
		return null
	}
}

async function findLatestSemVerTag(
	octokit: Octokit,
	owner: string,
	repo: string,
	prefix?: string,
	suffix?: string,
): Promise<null | string> {
	const tags = await listTags(octokit, owner, repo)

	const semverTags = tags
		.map((tag) => {
			let versionStr = prefix ? tag.replace(prefix, '') : tag
			if (suffix && versionStr.endsWith(suffix)) {
				versionStr = versionStr.slice(0, -suffix.length)
			}
			const parsed = parseSemVer(versionStr)

			return parsed ? { parsed, tag } : null
		})
		.filter(
			(item): item is { parsed: NonNullable<typeof item>['parsed']; tag: string } =>
				item !== null && !item.parsed.prerelease,
		)

	if (semverTags.length === 0) return null

	semverTags.sort((a, b) => compareSemVer(b.parsed, a.parsed))

	return semverTags[0].tag
}

async function findTagByPattern(
	octokit: Octokit,
	owner: string,
	repo: string,
	pattern: string,
): Promise<null | string> {
	const tags = await listTags(octokit, owner, repo)
	const regex = globToRegex(pattern)

	const matching = tags.filter((tag) => regex.test(tag))
	if (matching.length === 0) return null

	const semverMatches = matching
		.map((tag) => {
			const parsed = parseSemVer(tag.replace(/^v/, ''))

			return parsed ? { parsed, tag } : null
		})
		.filter((item): item is NonNullable<typeof item> => item !== null)

	if (semverMatches.length > 0) {
		semverMatches.sort((a, b) => compareSemVer(b.parsed, a.parsed))

		return semverMatches[0].tag
	}

	return matching[0]
}

function globToRegex(pattern: string): RegExp {
	const escaped = pattern
		.replace(/[.+^${}()|[\]\\]/g, '\\$&')
		.replace(/\*/g, '.*')
		.replace(/\?/g, '.')

	return new RegExp(`^${escaped}$`)
}

async function listTags(octokit: Octokit, owner: string, repo: string): Promise<string[]> {
	const tags: string[] = []
	const PER_PAGE = 100

	for (let page = 1; page <= 10; page++) {
		const { data } = await octokit.rest.repos.listTags({
			owner,
			page,
			per_page: PER_PAGE,
			repo,
		})

		tags.push(...data.map((t) => t.name))

		if (data.length < PER_PAGE) break
	}

	return tags
}
