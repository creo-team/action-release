import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fs from 'fs'
import { parseInputs } from './inputs'
import {
	applyChannel,
	bumpVersion,
	formatSemVer,
	parseSemVer,
	readVersionFromFile,
	readVersionFromPackageJson,
} from './version'
import { detectBumpFromMessages } from './bump'
import { buildCompareUrl, getTagsForStrategy, stripSuffix } from './tags'
import { findPreviousTag } from './previous-release'
import { buildTemplateVariables, renderTemplate } from './template'
import { formatRawChanges, generateChangelog } from './changelog'
import { updateChangelogFile } from './changelog-file'
import { generateCodename, getExistingReleaseNames } from './codename'
import { generateLlmReleaseNotes } from './llm'
import { buildActionFooter } from './action-footer'
import { createOrUpdateTag, createRelease, findExistingRelease } from './release'
import { uploadAssets } from './assets'
import { sendNotifications } from './notifications'
import { writeStepSummary } from './summary'
import type { SemVer } from './types'
import { SHORT_SHA_LENGTH, STABLE_CHANNEL } from './types'

function collectBumpTexts(bumpSource: string, messages: string[]): string[] {
	const context = github.context

	switch (bumpSource) {
		case 'all': {
			const texts: string[] = [...messages]
			const pr = context.payload.pull_request
			const title = pr?.title
			if (typeof title === 'string') texts.push(title)
			const body = pr?.body
			if (typeof body === 'string') texts.push(body)

			return texts
		}
		case 'pr-body': {
			const prBody = context.payload.pull_request?.body

			return typeof prBody === 'string' ? [prBody] : messages
		}
		case 'pr-title': {
			const prTitle = context.payload.pull_request?.title

			return typeof prTitle === 'string' ? [prTitle] : messages
		}
		default:
			return messages
	}
}

async function getCommitData(
	octokit: ReturnType<typeof github.getOctokit>,
	owner: string,
	repo: string,
	headSha: string,
	previousTag: null | string,
	includeDiff: boolean,
): Promise<{ diff: null | string; hashes: string[]; messages: string[] }> {
	if (!previousTag) {
		return { diff: null, hashes: [], messages: [] }
	}

	try {
		const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
			basehead: `${previousTag}...${headSha}`,
			owner,
			repo,
		})

		const messages = data.commits.map((c) => c.commit.message).filter((m): m is string => typeof m === 'string')
		const hashes = data.commits.map((c) => c.sha).filter((s): s is string => typeof s === 'string')

		let diff: null | string = null
		if (includeDiff) {
			const { data: diffData } = await octokit.rest.repos.compareCommitsWithBasehead({
				basehead: `${previousTag}...${headSha}`,
				mediaType: { format: 'diff' },
				owner,
				repo,
			})
			diff = diffData as unknown as string
		}

		return { diff, hashes, messages }
	} catch {
		core.warning(`Could not compare ${previousTag}...${headSha}`)

		return { diff: null, hashes: [], messages: [] }
	}
}

async function getNextChannelNumber(
	octokit: ReturnType<typeof github.getOctokit>,
	owner: string,
	repo: string,
	version: SemVer,
	channel: string,
	prefix: string,
): Promise<number> {
	const pattern = `${prefix}${version.major}.${version.minor}.${version.patch}-${channel}.`

	try {
		const { data: tags } = await octokit.rest.repos.listTags({
			owner,
			per_page: 100,
			repo,
		})

		let highest = 0
		for (const tag of tags) {
			if (tag.name.startsWith(pattern)) {
				const numStr = tag.name.substring(pattern.length)
				const num = parseInt(numStr, 10)
				if (!isNaN(num) && num > highest) {
					highest = num
				}
			}
		}

		return highest + 1
	} catch {
		return 1
	}
}

async function run(): Promise<void> {
	const config = parseInputs()
	const octokit = github.getOctokit(config.token)
	const { owner, repo } = github.context.repo
	const sha = github.context.sha

	const previousTag = await findPreviousTag(octokit, owner, repo, config.previousReleaseStrategy, {
		matchPattern: config.tagMatchPattern,
		specificTag: config.previousTag,
		tagPrefix: config.tagPrefix,
		tagSuffix: config.tagSuffix,
	})

	core.info(previousTag ? `Previous tag: ${previousTag}` : 'No previous tag found')

	const { diff, hashes, messages } = await getCommitData(
		octokit,
		owner,
		repo,
		sha,
		previousTag,
		config.llmContext === 'diff' || config.llmContext === 'both',
	)

	let version: SemVer

	if (config.version) {
		const parsed = parseSemVer(config.version)
		if (!parsed) throw new Error(`Invalid version: ${config.version}`)
		version = parsed
	} else
		switch (config.versionSource) {
			case 'auto': {
				if (!previousTag) {
					const parsed = parseSemVer(config.initialVersion)
					if (!parsed) throw new Error(`Invalid initial-version: ${config.initialVersion}`)
					version = parsed
					core.info(`No previous tag — using initial version ${config.initialVersion}`)
				} else {
					const stripped = stripSuffix(previousTag.replace(config.tagPrefix, ''), config.tagSuffix)
					const previousVersion = parseSemVer(stripped)
					if (!previousVersion) {
						throw new Error(`Cannot parse previous tag "${previousTag}" as semver`)
					}

					const bumpTexts = collectBumpTexts(config.bumpSource, messages)
					const bumpResult = detectBumpFromMessages(
						bumpTexts,
						config.majorKeywords,
						config.minorKeywords,
						config.patchKeywords,
					)

					const bumpType = bumpResult.type === 'none' ? config.defaultBump : bumpResult.type
					core.info(`Bump: ${bumpType} (${bumpResult.reason})`)

					if (bumpType === 'none') {
						core.info('No bump detected and default-bump is "none" — skipping release')
						setSkippedOutputs()

						return
					}

					version = bumpVersion(previousVersion, bumpType)
				}
				break
			}

			case 'file': {
				const versionFile = config.versionFile
				if (!versionFile) throw new Error('version-source is "file" but version-file is missing')
				const versionStr = readVersionFromFile(versionFile, config.versionPattern)
				const parsed = parseSemVer(versionStr)
				if (!parsed) throw new Error(`Cannot parse version from file: ${versionStr}`)
				version = parsed
				break
			}

			case 'package-json': {
				const versionStr = readVersionFromPackageJson('package.json')
				const parsed = parseSemVer(versionStr)
				if (!parsed) throw new Error(`Cannot parse version from package.json: ${versionStr}`)
				version = parsed
				break
			}
		}

	if (config.channel !== STABLE_CHANNEL) {
		const channelNumber = await getNextChannelNumber(
			octokit,
			owner,
			repo,
			version,
			config.channel,
			config.tagPrefix,
		)
		version = applyChannel(version, config.channel, channelNumber)
	}

	const versionStr = formatSemVer(version)
	const tags = getTagsForStrategy(version, config.tagPrefix, config.tagStrategy, config.tagSuffix)
	const primaryTag = tags[0]
	if (!primaryTag) throw new Error('No tags generated')

	core.info(`Version: ${versionStr}`)
	core.info(`Tags: ${tags.join(', ')}`)

	const changelogMd = config.changelog ? generateChangelog(messages, hashes) : ''

	const rawChanges = formatRawChanges(messages, hashes)

	let codename = ''
	if (config.codename !== 'off') {
		const existingNames = await getExistingReleaseNames(octokit, owner, repo)
		codename = generateCodename(config.codename, existingNames, config.codenameWords)
		core.info(`Codename: ${codename}`)
	}

	let llmSummary = ''
	if (config.llmReleaseNotes && config.llmApiKey) {
		llmSummary = await generateLlmReleaseNotes(
			{
				apiKey: config.llmApiKey,
				maxTokens: config.llmMaxTokens,
				model: config.llmModel,
				provider: config.llmProvider,
				systemPrompt: config.llmPrompt,
			},
			{
				commitMessages: messages,
				diff: diff ?? undefined,
				newTag: primaryTag,
				previousTag: previousTag ?? '',
				repo: `${owner}/${repo}`,
			},
		)
	}

	const compareUrl = previousTag ? buildCompareUrl(owner, repo, previousTag, primaryTag) : ''
	const actionFooter = buildActionFooter()

	const templateVars = buildTemplateVariables({
		action_release_footer: actionFooter,
		actor: github.context.actor,
		branch: github.context.ref.replace('refs/heads/', ''),
		changelog: changelogMd,
		changes: rawChanges,
		codename,
		commit: sha,
		commit_short: sha.substring(0, SHORT_SHA_LENGTH),
		compare_url: compareUrl,
		date: new Date().toISOString().split('T')[0],
		llm_summary: llmSummary,
		major: String(version.major),
		minor: String(version.minor),
		owner,
		patch: String(version.patch),
		previous_tag: previousTag ?? '',
		release_name: '',
		release_url: '',
		repo: `${owner}/${repo}`,
		tag: primaryTag,
		version: versionStr,
	})

	const DEFAULT_BODY_TEMPLATE = "## What's Changed\n\n{{changelog}}\n\n**Full Changelog**: {{compare_url}}"

	let body = ''
	if (config.bodyTemplate) {
		body = renderTemplate(config.bodyTemplate, templateVars)
	} else if (config.bodyPath) {
		body = fs.readFileSync(config.bodyPath, 'utf-8')
		body = renderTemplate(body, templateVars)
	} else if (config.body) {
		body = renderTemplate(config.body, templateVars)
	} else if (config.changelog) {
		body = renderTemplate(DEFAULT_BODY_TEMPLATE, templateVars)
	}

	body = body ? `${body}\n\n${actionFooter}` : actionFooter

	let releaseName: string
	if (config.name) {
		releaseName = renderTemplate(config.name, templateVars)
	} else if (config.nameTemplate) {
		releaseName = renderTemplate(config.nameTemplate, templateVars)
	} else {
		releaseName = primaryTag
	}

	templateVars.release_name = releaseName

	if (config.dryRun) {
		core.info('Dry run — no tags or releases will be created')
		setOutputs(
			primaryTag,
			versionStr,
			version,
			tags,
			previousTag,
			compareUrl,
			codename,
			releaseName,
			changelogMd,
			llmSummary,
			body,
			true,
			false,
		)
		await writeStepSummary(templateVars, {
			changelog: changelogMd ? changelogMd : undefined,
			codename: codename ? codename : undefined,
			created: false,
			dryRun: true,
			llmSummary: llmSummary ? llmSummary : undefined,
			tags,
		})

		return
	}

	if (config.ifExists === 'skip') {
		const existing = await findExistingRelease(octokit, owner, repo, primaryTag)
		if (existing) {
			core.info(`Release ${primaryTag} already exists and if-exists is "skip" — skipping tags and release`)

			templateVars.release_url = existing.url
			setOutputs(
				primaryTag,
				versionStr,
				version,
				tags,
				previousTag,
				compareUrl,
				codename,
				releaseName,
				changelogMd,
				llmSummary,
				body,
				false,
				false,
				existing.url,
				existing.id,
				existing.uploadUrl,
			)
			await writeStepSummary(templateVars, {
				changelog: changelogMd ? changelogMd : undefined,
				codename: codename ? codename : undefined,
				created: false,
				dryRun: false,
				llmSummary: llmSummary ? llmSummary : undefined,
				tags,
			})

			return
		}
	}

	for (const tag of tags) {
		await createOrUpdateTag(octokit, owner, repo, tag, sha)
	}

	const releaseResult = await createRelease(octokit, {
		body,
		discussionCategory: config.discussionCategory,
		draft: config.draft,
		generateReleaseNotes: config.generateReleaseNotes,
		ifExists: config.ifExists,
		makeLatest: config.makeLatest,
		name: releaseName,
		owner,
		prerelease: config.prerelease,
		repo,
		tag: primaryTag,
		targetCommitish: config.targetCommitish,
	})

	templateVars.release_url = releaseResult.url

	let uploadedAssets: string[] = []
	if (config.files) {
		uploadedAssets = await uploadAssets(octokit, {
			failOnUnmatched: config.failOnUnmatchedFiles,
			overwrite: config.overwriteFiles,
			owner,
			patterns: config.files,
			releaseId: releaseResult.id,
			repo,
			workingDirectory: config.workingDirectory,
		})
	}

	if (config.updateChangelog) {
		const changelogContent = changelogMd || rawChanges
		updateChangelogFile(config.changelogPath, versionStr, templateVars.date, changelogContent)
		core.info(`Updated ${config.changelogPath}`)
	}

	const hasNotifications = [
		config.notifications.slackWebhook,
		config.notifications.discordWebhook,
		config.notifications.teamsWebhook,
		config.notifications.genericWebhookUrl,
	].some((w) => Boolean(w))

	if (hasNotifications && releaseResult.created) {
		await sendNotifications(config.notifications, templateVars)
	}

	const marketplaceHint =
		config.publishToMarketplace && releaseResult.created
			? { editUrl: `https://github.com/${owner}/${repo}/releases/edit/${encodeURIComponent(primaryTag)}` }
			: undefined

	await writeStepSummary(templateVars, {
		changelog: changelogMd ? changelogMd : undefined,
		codename: codename ? codename : undefined,
		created: releaseResult.created,
		dryRun: false,
		llmSummary: llmSummary ? llmSummary : undefined,
		marketplace: marketplaceHint,
		tags,
		uploadedAssets: uploadedAssets.length > 0 ? uploadedAssets : undefined,
	})

	setOutputs(
		primaryTag,
		versionStr,
		version,
		tags,
		previousTag,
		compareUrl,
		codename,
		releaseName,
		changelogMd,
		llmSummary,
		body,
		false,
		releaseResult.created,
		releaseResult.url,
		releaseResult.id,
		releaseResult.uploadUrl,
	)
}

function setOutputs(
	tag: string,
	version: string,
	semver: SemVer,
	tags: string[],
	previousTag: null | string,
	compareUrl: string,
	codename: string,
	releaseName: string,
	changelog: string,
	llmSummary: string,
	body: string,
	dryRun: boolean,
	created: boolean,
	url?: string,
	id?: number,
	uploadUrl?: string,
): void {
	core.setOutput('tag', tag)
	core.setOutput('version', version)
	core.setOutput('major', String(semver.major))
	core.setOutput('minor', String(semver.minor))
	core.setOutput('patch', String(semver.patch))
	core.setOutput('tags', JSON.stringify(tags))
	core.setOutput('previous-tag', previousTag ?? '')
	core.setOutput('compare-url', compareUrl)
	core.setOutput('url', url ?? '')
	core.setOutput('id', String(id ?? ''))
	core.setOutput('upload-url', uploadUrl ?? '')
	core.setOutput('created', String(created))
	core.setOutput('codename', codename)
	core.setOutput('release-name', releaseName)
	core.setOutput('changelog', changelog)
	core.setOutput('llm-summary', llmSummary)
	core.setOutput('body', body)
	core.setOutput('dry-run', String(dryRun))
}

function setSkippedOutputs(): void {
	core.setOutput('created', 'false')
	core.setOutput('dry-run', 'false')
	core.setOutput('tag', '')
	core.setOutput('version', '')
}

run().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error)
	core.setFailed(message)
})
