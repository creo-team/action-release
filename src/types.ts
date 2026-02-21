// ============================================================================
// Bump Types
// ============================================================================

export type BumpType = 'major' | 'minor' | 'patch' | 'none';

export const BUMP_PRIORITY: Record<BumpType, number> = {
  major: 3,
  minor: 2,
  patch: 1,
  none: 0,
};

// ============================================================================
// Version
// ============================================================================

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export type VersionSource = 'auto' | 'package-json' | 'file' | 'manual';

// ============================================================================
// Tags
// ============================================================================

export type TagStrategy = 'full' | 'all' | 'full-and-minor';

// ============================================================================
// Pre-release Channels
// ============================================================================

export const STABLE_CHANNEL = 'stable';

// ============================================================================
// Release Controls
// ============================================================================

export type IfExistsBehavior = 'skip' | 'fail' | 'update';
export type MakeLatest = 'true' | 'false' | 'legacy';

// ============================================================================
// LLM
// ============================================================================

export type LlmProvider = 'openai' | 'anthropic' | 'openrouter';
export type LlmContext = 'commits' | 'diff' | 'both';

export const LLM_DEFAULT_MODELS: Record<LlmProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  openrouter: 'openai/gpt-4o-mini',
};

export const LLM_ENDPOINTS: Record<LlmProvider, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
};

export const DEFAULT_LLM_MAX_TOKENS = 1024;

export const DEFAULT_LLM_PROMPT = `You are a release notes writer for an open-source project.
Given the commit history (and optionally the diff) for a new release, write clear, concise release notes.
Group changes into sections: Added, Changed, Fixed, Removed (omit empty sections).
Use bullet points. Highlight breaking changes prominently at the top if any exist.
Keep it under 300 words. Be professional but approachable.`;

// ============================================================================
// Codename Themes
// ============================================================================

export type CodenameTheme =
  | 'off'
  | 'adjective-animal'
  | 'the-office'
  | 'planets'
  | 'mythology'
  | 'gemstones'
  | 'ships'
  | 'custom';

// ============================================================================
// Bump Source
// ============================================================================

export type BumpSource = 'commits' | 'pr-title' | 'pr-body' | 'all';

// ============================================================================
// Previous Release Strategy
// ============================================================================

export type PreviousReleaseStrategy =
  | 'latest-release'
  | 'latest-tag'
  | 'tag-pattern'
  | 'specific-tag';

// ============================================================================
// Notification Providers
// ============================================================================

export interface NotificationConfig {
  slackWebhook?: string;
  discordWebhook?: string;
  teamsWebhook?: string;
  genericWebhookUrl?: string;
  template?: string;
}

// ============================================================================
// Action Config (parsed inputs)
// ============================================================================

export interface ActionConfig {
  // Version
  version?: string;
  versionSource: VersionSource;
  versionFile?: string;
  versionPattern: string;
  defaultBump: BumpType;
  initialVersion: string;

  // Bump keywords
  majorKeywords: string[];
  minorKeywords: string[];
  patchKeywords: string[];
  bumpSource: BumpSource;

  // Tags
  tagPrefix: string;
  tagStrategy: TagStrategy;

  // Channel
  channel: string;

  // Release controls
  draft: boolean;
  prerelease: boolean;
  makeLatest: MakeLatest;
  targetCommitish?: string;
  discussionCategory?: string;
  ifExists: IfExistsBehavior;

  // Release notes
  body?: string;
  bodyPath?: string;
  bodyTemplate?: string;
  appendBody: boolean;
  generateReleaseNotes: boolean;

  // Release name / codename
  name?: string;
  nameTemplate?: string;
  codename: CodenameTheme;
  codenameWords?: string[];

  // Changelog
  changelog: boolean;
  updateChangelog: boolean;
  changelogPath: string;

  // LLM
  llmReleaseNotes: boolean;
  llmProvider: LlmProvider;
  llmApiKey?: string;
  llmModel?: string;
  llmPrompt: string;
  llmMaxTokens: number;
  llmContext: LlmContext;

  // Assets
  files?: string;
  workingDirectory: string;
  overwriteFiles: boolean;
  failOnUnmatchedFiles: boolean;

  // Notifications
  notifications: NotificationConfig;

  // Previous release
  previousReleaseStrategy: PreviousReleaseStrategy;
  previousTag?: string;
  tagMatchPattern?: string;

  // Behavior
  dryRun: boolean;
  token: string;
}

// ============================================================================
// Template Variables
// ============================================================================

export interface TemplateVariables {
  tag: string;
  version: string;
  major: string;
  minor: string;
  patch: string;
  commit: string;
  commit_short: string;
  previous_tag: string;
  compare_url: string;
  changes: string;
  changelog: string;
  llm_summary: string;
  codename: string;
  date: string;
  repo: string;
  owner: string;
  branch: string;
  actor: string;
  release_url: string;
  release_name: string;
}

// ============================================================================
// Results
// ============================================================================

export interface BumpResult {
  type: BumpType;
  reason: string;
}

export interface ReleaseResult {
  id: number;
  url: string;
  uploadUrl: string;
  tag: string;
  created: boolean;
}

// ============================================================================
// Defaults
// ============================================================================

export const DEFAULT_INITIAL_VERSION = '0.1.0';
export const DEFAULT_TAG_PREFIX = 'v';
export const DEFAULT_VERSION_PATTERN = '"version":\\s*"([^"]+)"';
export const DEFAULT_CHANGELOG_PATH = 'CHANGELOG.md';
export const SHORT_SHA_LENGTH = 7;
export const MAX_CODENAME_RETRIES = 50;
