export type BumpType = 'major' | 'minor' | 'none' | 'patch'

export const BUMP_PRIORITY: Record<BumpType, number> = {
	major: 3,
	minor: 2,
	none: 0,
	patch: 1,
}

export interface SemVer {
	major: number
	minor: number
	patch: number
	prerelease?: string
}

export type TagStrategy = 'all' | 'full-and-minor' | 'full'

export type VersionSource = 'auto' | 'file' | 'package-json'

export const STABLE_CHANNEL = 'stable'

export type IfExistsBehavior = 'fail' | 'skip' | 'update'
export type LlmContext = 'both' | 'commits' | 'diff'

export type LlmProvider = 'anthropic' | 'openai' | 'openrouter'
export type MakeLatest = 'false' | 'legacy' | 'true'

export const LLM_DEFAULT_MODELS: Record<LlmProvider, string> = {
	anthropic: 'claude-sonnet-4-20250514',
	openai: 'gpt-4o-mini',
	openrouter: 'openai/gpt-4o-mini',
}

export const LLM_ENDPOINTS: Record<LlmProvider, string> = {
	anthropic: 'https://api.anthropic.com/v1/messages',
	openai: 'https://api.openai.com/v1/chat/completions',
	openrouter: 'https://openrouter.ai/api/v1/chat/completions',
}

export const DEFAULT_LLM_MAX_TOKENS = 1024

export const DEFAULT_LLM_PROMPT = `Write release notes from the commit history. Be clear and concise.
Sections: What's New, Fixes, Other (omit empty). Bullet points. Under 200 words.
Put breaking changes first with a brief warning. Professional tone.`

export interface ActionConfig {
	appendBody: boolean

	// Release notes
	body?: string
	bodyPath?: string
	bodyTemplate?: string
	bumpSource: BumpSource

	// Changelog
	changelog: boolean

	changelogPath: string

	// Channel
	channel: string
	codename: CodenameTheme
	codenameWords?: string[]

	defaultBump: BumpType
	discussionCategory?: string

	// Release controls
	draft: boolean

	// Behavior
	dryRun: boolean
	failOnUnmatchedFiles: boolean

	// Assets
	files?: string
	generateReleaseNotes: boolean
	ifExists: IfExistsBehavior
	initialVersion: string

	llmApiKey?: string
	llmContext: LlmContext
	llmMaxTokens: number
	llmModel?: string
	llmPrompt: string

	llmProvider: LlmProvider

	// LLM
	llmReleaseNotes: boolean

	// Bump keywords
	majorKeywords: string[]
	makeLatest: MakeLatest

	minorKeywords: string[]

	// Release name / codename
	name?: string
	nameTemplate?: string

	// Notifications
	notifications: NotificationConfig
	overwriteFiles: boolean
	patchKeywords: string[]
	prerelease: boolean

	// Previous release
	previousReleaseStrategy: PreviousReleaseStrategy
	previousTag?: string
	tagMatchPattern?: string

	// Tags
	tagPrefix: string
	tagStrategy: TagStrategy
	tagSuffix: string
	targetCommitish?: string
	token: string

	updateChangelog: boolean

	// Version
	version?: string
	versionFile?: string
	versionPattern: string

	versionSource: VersionSource
	workingDirectory: string
}

export interface BumpResult {
	reason: string
	type: BumpType
}

export type BumpSource = 'all' | 'commits' | 'pr-body' | 'pr-title'

export type CodenameTheme =
	| 'adjective-animal'
	| 'custom'
	| 'gemstones'
	| 'mythology'
	| 'off'
	| 'planets'
	| 'ships'
	| 'the-office'

export interface NotificationConfig {
	discordWebhook?: string
	genericWebhookUrl?: string
	slackWebhook?: string
	teamsWebhook?: string
	template?: string
}

export type PreviousReleaseStrategy = 'latest-release' | 'latest-tag' | 'specific-tag' | 'tag-pattern'

export interface ReleaseResult {
	created: boolean
	id: number
	tag: string
	uploadUrl: string
	url: string
}

export interface TemplateVariables {
	actor: string
	branch: string
	changelog: string
	changes: string
	codename: string
	commit: string
	commit_short: string
	compare_url: string
	date: string
	llm_summary: string
	major: string
	minor: string
	owner: string
	patch: string
	previous_tag: string
	release_name: string
	release_url: string
	repo: string
	tag: string
	version: string
}

export const DEFAULT_INITIAL_VERSION = '0.1.0'
export const DEFAULT_TAG_PREFIX = ''
export const DEFAULT_TAG_SUFFIX = ''
export const DEFAULT_VERSION_PATTERN = '"version":\\s*"([^"]+)"'
export const DEFAULT_CHANGELOG_PATH = 'CHANGELOG.md'
export const SHORT_SHA_LENGTH = 7
export const MAX_CODENAME_RETRIES = 50
