import * as core from '@actions/core'
import type {
	ActionConfig,
	BumpSource,
	BumpType,
	CodenameTheme,
	IfExistsBehavior,
	LlmContext,
	LlmProvider,
	MakeLatest,
	PreviousReleaseStrategy,
	TagStrategy,
	VersionSource,
} from './types'
import {
	DEFAULT_CHANGELOG_PATH,
	DEFAULT_INITIAL_VERSION,
	DEFAULT_LLM_MAX_TOKENS,
	DEFAULT_LLM_PROMPT,
	DEFAULT_TAG_PREFIX,
	DEFAULT_TAG_SUFFIX,
	DEFAULT_VERSION_PATTERN,
	STABLE_CHANNEL,
} from './types'

function parseBool(value: string): boolean {
	return value.toLowerCase() === 'true'
}

function parseCommaSeparated(value: string): string[] {
	return value
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
}

function parseOptional(value: string): string | undefined {
	return value.trim() || undefined
}

function parseWordsInput(value: string): string[] | undefined {
	const trimmed = value.trim()
	if (!trimmed) return undefined

	const words = trimmed.includes('\n') ? trimmed.split('\n') : trimmed.split(',')

	return words.map((w) => w.trim()).filter(Boolean)
}

const VALID_VERSION_SOURCES: VersionSource[] = ['auto', 'package-json', 'file']
const VALID_BUMP_TYPES: BumpType[] = ['major', 'minor', 'patch', 'none']
const VALID_BUMP_SOURCES: BumpSource[] = ['commits', 'pr-title', 'pr-body', 'all']
const VALID_TAG_STRATEGIES: TagStrategy[] = ['full', 'all', 'full-and-minor']
const VALID_IF_EXISTS: IfExistsBehavior[] = ['skip', 'fail', 'update']
const VALID_MAKE_LATEST: MakeLatest[] = ['true', 'false', 'legacy']
const VALID_LLM_PROVIDERS: LlmProvider[] = ['openai', 'anthropic', 'openrouter']
const VALID_LLM_CONTEXTS: LlmContext[] = ['commits', 'diff', 'both']
const VALID_PREVIOUS_STRATEGIES: PreviousReleaseStrategy[] = [
	'latest-release',
	'latest-tag',
	'tag-pattern',
	'specific-tag',
]
const VALID_CODENAME_THEMES: CodenameTheme[] = [
	'off',
	'adjective-animal',
	'the-office',
	'planets',
	'mythology',
	'gemstones',
	'ships',
	'custom',
]

export function parseInputs(): ActionConfig {
	const versionSource = validateEnum(core.getInput('version-source'), VALID_VERSION_SOURCES, 'version-source')

	const defaultBump = validateEnum(core.getInput('default-bump'), VALID_BUMP_TYPES, 'default-bump')

	const bumpSource = validateEnum(core.getInput('bump-source'), VALID_BUMP_SOURCES, 'bump-source')

	const floatingTags = parseBool(core.getInput('floating-tags'))
	const tagStrategy: TagStrategy = floatingTags
		? 'all'
		: validateEnum(core.getInput('tag-strategy'), VALID_TAG_STRATEGIES, 'tag-strategy')

	const ifExists = validateEnum(core.getInput('if-exists'), VALID_IF_EXISTS, 'if-exists')

	const makeLatest = validateEnum(core.getInput('make-latest'), VALID_MAKE_LATEST, 'make-latest')

	const llmProvider = validateEnum(core.getInput('llm-provider'), VALID_LLM_PROVIDERS, 'llm-provider')

	const llmContext = validateEnum(core.getInput('llm-context'), VALID_LLM_CONTEXTS, 'llm-context')

	const previousReleaseStrategy = validateEnum(
		core.getInput('previous-release-strategy'),
		VALID_PREVIOUS_STRATEGIES,
		'previous-release-strategy',
	)

	const codename = validateEnum(core.getInput('codename'), VALID_CODENAME_THEMES, 'codename')

	const channel = core.getInput('channel') || STABLE_CHANNEL
	const llmReleaseNotes = parseBool(core.getInput('llm-release-notes'))

	if (llmReleaseNotes && !core.getInput('llm-api-key')) {
		core.warning('llm-release-notes is enabled but no llm-api-key provided. LLM notes will be skipped.')
	}

	if (versionSource === 'file' && !core.getInput('version-file')) {
		throw new Error('version-source is "file" but no version-file input was provided.')
	}

	if (codename === 'custom' && !core.getInput('codename-words')) {
		throw new Error('codename is "custom" but no codename-words input was provided.')
	}

	const llmMaxTokensRaw = core.getInput('llm-max-tokens')
	const llmMaxTokens = llmMaxTokensRaw ? parseInt(llmMaxTokensRaw, 10) : DEFAULT_LLM_MAX_TOKENS

	if (isNaN(llmMaxTokens) || llmMaxTokens <= 0) {
		throw new Error(`Invalid llm-max-tokens: "${llmMaxTokensRaw}". Must be a positive integer.`)
	}

	return {
		appendBody: parseBool(core.getInput('append-body')),
		body: parseOptional(core.getInput('body')),
		bodyPath: parseOptional(core.getInput('body-path')),
		bodyTemplate: parseOptional(core.getInput('body-template')),
		bumpSource,
		changelog: parseBool(core.getInput('changelog')),

		changelogPath: core.getInput('changelog-path') || DEFAULT_CHANGELOG_PATH,
		channel,
		codename,
		codenameWords: parseWordsInput(core.getInput('codename-words')),

		defaultBump,
		discussionCategory: parseOptional(core.getInput('discussion-category')),

		draft: parseBool(core.getInput('draft')),

		publishToMarketplace: parseBool(core.getInput('publish-to-marketplace')),

		dryRun: parseBool(core.getInput('dry-run')),
		failOnUnmatchedFiles: parseBool(core.getInput('fail-on-unmatched-files')),
		files: parseOptional(core.getInput('files')),
		generateReleaseNotes: parseBool(core.getInput('generate-release-notes')),
		ifExists,
		initialVersion: core.getInput('initial-version') || DEFAULT_INITIAL_VERSION,

		llmApiKey: parseOptional(core.getInput('llm-api-key')),
		llmContext,
		llmMaxTokens,
		llmModel: parseOptional(core.getInput('llm-model')),
		llmPrompt: core.getInput('llm-prompt') || DEFAULT_LLM_PROMPT,

		llmProvider,
		llmReleaseNotes,
		majorKeywords: parseCommaSeparated(core.getInput('major-keywords') || 'BREAKING CHANGE,major,!:'),
		makeLatest,

		minorKeywords: parseCommaSeparated(core.getInput('minor-keywords') || 'feat,feature,minor'),
		name: parseOptional(core.getInput('name')),
		nameTemplate: parseOptional(core.getInput('name-template')),

		notifications: {
			discordWebhook: parseOptional(core.getInput('discord-webhook')),
			genericWebhookUrl: parseOptional(core.getInput('webhook-url')),
			slackWebhook: parseOptional(core.getInput('slack-webhook')),
			teamsWebhook: parseOptional(core.getInput('teams-webhook')),
			template: parseOptional(core.getInput('notification-template')),
		},
		overwriteFiles: (() => {
			const raw = core.getInput('overwrite-files')

			return parseBool(raw.trim() === '' ? 'true' : raw)
		})(),
		patchKeywords: (() => {
			const raw = core.getInput('patch-keywords')

			return parseCommaSeparated(raw.trim() === '' ? 'fix,bug,patch,chore,refactor' : raw)
		})(),
		prerelease: parseBool(core.getInput('prerelease')) || channel !== STABLE_CHANNEL,
		previousReleaseStrategy,
		previousTag: parseOptional(core.getInput('previous-tag')),
		tagMatchPattern: parseOptional(core.getInput('tag-match-pattern')),

		tagPrefix: core.getInput('tag-prefix') ?? DEFAULT_TAG_PREFIX,
		tagStrategy,
		tagSuffix: core.getInput('tag-suffix') ?? DEFAULT_TAG_SUFFIX,
		targetCommitish: parseOptional(core.getInput('target-commitish')),
		token: (() => {
			const t = core.getInput('token')

			return t.trim() !== '' ? t : (process.env.GITHUB_TOKEN ?? '')
		})(),

		updateChangelog: parseBool(core.getInput('update-changelog')),

		version: parseOptional(core.getInput('version')),
		versionFile: parseOptional(core.getInput('version-file')),
		versionPattern: core.getInput('version-pattern') || DEFAULT_VERSION_PATTERN,

		versionSource,
		workingDirectory: core.getInput('working-directory') || '.',
	}
}

function validateEnum<T extends string>(value: string, valid: T[], inputName: string): T {
	const lower = value.toLowerCase().trim() as T
	if (!valid.includes(lower)) {
		throw new Error(`Invalid value "${value}" for ${inputName}. Must be one of: ${valid.join(', ')}`)
	}

	return lower
}
