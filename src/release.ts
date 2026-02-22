import * as core from '@actions/core'
import type * as github from '@actions/github'
import type { IfExistsBehavior, MakeLatest, ReleaseResult } from './types'

export interface CreateReleaseOptions {
	body: string
	discussionCategory?: string
	draft: boolean
	generateReleaseNotes: boolean
	ifExists: IfExistsBehavior
	makeLatest: MakeLatest
	name: string
	owner: string
	prerelease: boolean
	repo: string
	tag: string
	targetCommitish?: string
}

interface ExistingRelease {
	id: number
	tag: string
	uploadUrl: string
	url: string
}

type Octokit = ReturnType<typeof github.getOctokit>

export async function createRelease(octokit: Octokit, options: CreateReleaseOptions): Promise<ReleaseResult> {
	const existing = await findExistingRelease(octokit, options.owner, options.repo, options.tag)

	if (existing) {
		return handleExisting(octokit, options, existing)
	}

	return createNewRelease(octokit, options)
}

async function createNewRelease(octokit: Octokit, options: CreateReleaseOptions): Promise<ReleaseResult> {
	core.info(`Creating release ${options.tag}`)

	const { data } = await octokit.rest.repos.createRelease({
		body: options.body,
		discussion_category_name: options.discussionCategory,
		draft: options.draft,
		generate_release_notes: options.generateReleaseNotes,
		make_latest: options.makeLatest,
		name: options.name,
		owner: options.owner,
		prerelease: options.prerelease,
		repo: options.repo,
		tag_name: options.tag,
		target_commitish: options.targetCommitish,
	})

	return {
		created: true,
		id: data.id,
		tag: data.tag_name,
		uploadUrl: data.upload_url,
		url: data.html_url,
	}
}

async function findExistingRelease(
	octokit: Octokit,
	owner: string,
	repo: string,
	tag: string,
): Promise<ExistingRelease | null> {
	try {
		const { data } = await octokit.rest.repos.getReleaseByTag({
			owner,
			repo,
			tag,
		})

		return {
			id: data.id,
			tag: data.tag_name,
			uploadUrl: data.upload_url,
			url: data.html_url,
		}
	} catch {
		return null
	}
}

async function handleExisting(
	octokit: Octokit,
	options: CreateReleaseOptions,
	existing: ExistingRelease,
): Promise<ReleaseResult> {
	switch (options.ifExists) {
		case 'fail':
			throw new Error(`Release ${options.tag} already exists and if-exists is "fail"`)

		case 'update':
			return updateExistingRelease(octokit, options, existing.id)

		case 'skip':
			core.info(`Release ${options.tag} already exists — skipping`)

			return { ...existing, created: false }
	}
}

async function updateExistingRelease(
	octokit: Octokit,
	options: CreateReleaseOptions,
	releaseId: number,
): Promise<ReleaseResult> {
	core.info(`Updating existing release ${options.tag}`)

	const { data } = await octokit.rest.repos.updateRelease({
		body: options.body,
		draft: options.draft,
		make_latest: options.makeLatest,
		name: options.name,
		owner: options.owner,
		prerelease: options.prerelease,
		release_id: releaseId,
		repo: options.repo,
	})

	return {
		created: false,
		id: data.id,
		tag: data.tag_name,
		uploadUrl: data.upload_url,
		url: data.html_url,
	}
}

const REF_ALREADY_EXISTS = 'Reference already exists'
const REF_UPDATE_FAILED = 'Reference update failed'

/** Ref for getRef/updateRef (tags/v0.1.0); createRef needs refs/tags/v0.1.0 */
const refForPath = (tag: string): string => `tags/${tag}`
const refForCreate = (tag: string): string => `refs/tags/${tag}`

export async function createOrUpdateTag(
	octokit: Octokit,
	owner: string,
	repo: string,
	tag: string,
	sha: string,
): Promise<void> {
	const pathRef = refForPath(tag)
	const createRef = refForCreate(tag)

	try {
		await octokit.rest.git.getRef({
			owner,
			ref: pathRef,
			repo,
		})

		await octokit.rest.git.updateRef({
			force: true,
			owner,
			ref: pathRef,
			repo,
			sha,
		})

		core.info(`Updated tag ${tag} → ${sha.substring(0, 7)}`)
	} catch (updateErr) {
		const msg = updateErr instanceof Error ? updateErr.message : typeof updateErr === 'string' ? updateErr : ''
		if (msg.includes(REF_UPDATE_FAILED)) {
			core.info(`Tag ${tag} exists but cannot be updated (e.g. release tag) — skipping`)

			return
		}
		try {
			await octokit.rest.git.createRef({
				owner,
				ref: createRef,
				repo,
				sha,
			})
			core.info(`Created tag ${tag} → ${sha.substring(0, 7)}`)
		} catch (createErr) {
			const message =
				createErr instanceof Error
					? createErr.message
					: typeof createErr === 'string'
						? createErr
						: 'Unknown error'

			if (message.includes(REF_ALREADY_EXISTS)) {
				try {
					await octokit.rest.git.updateRef({
						force: true,
						owner,
						ref: pathRef,
						repo,
						sha,
					})
					core.info(`Updated tag ${tag} → ${sha.substring(0, 7)}`)
				} catch (retryErr) {
					const retryMsg =
						retryErr instanceof Error ? retryErr.message : typeof retryErr === 'string' ? retryErr : ''
					if (retryMsg.includes(REF_UPDATE_FAILED)) {
						core.info(`Tag ${tag} exists but cannot be updated — skipping`)
					} else {
						throw retryErr
					}
				}
			} else {
				throw createErr
			}
		}
	}
}
