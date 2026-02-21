export type BumpType = 'major' | 'minor' | 'patch' | 'none';
export declare const BUMP_PRIORITY: Record<BumpType, number>;
export interface SemVer {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
}
export type VersionSource = 'auto' | 'package-json' | 'file' | 'manual';
export type TagStrategy = 'full' | 'all' | 'full-and-minor';
export declare const STABLE_CHANNEL = "stable";
export type IfExistsBehavior = 'skip' | 'fail' | 'update';
export type MakeLatest = 'true' | 'false' | 'legacy';
export type LlmProvider = 'openai' | 'anthropic' | 'openrouter';
export type LlmContext = 'commits' | 'diff' | 'both';
export declare const LLM_DEFAULT_MODELS: Record<LlmProvider, string>;
export declare const LLM_ENDPOINTS: Record<LlmProvider, string>;
export declare const DEFAULT_LLM_MAX_TOKENS = 1024;
export declare const DEFAULT_LLM_PROMPT = "You are a release notes writer for an open-source project.\nGiven the commit history (and optionally the diff) for a new release, write clear, concise release notes.\nGroup changes into sections: Added, Changed, Fixed, Removed (omit empty sections).\nUse bullet points. Highlight breaking changes prominently at the top if any exist.\nKeep it under 300 words. Be professional but approachable.";
export type CodenameTheme = 'off' | 'adjective-animal' | 'the-office' | 'planets' | 'mythology' | 'gemstones' | 'ships' | 'custom';
export type BumpSource = 'commits' | 'pr-title' | 'pr-body' | 'all';
export type PreviousReleaseStrategy = 'latest-release' | 'latest-tag' | 'tag-pattern' | 'specific-tag';
export interface NotificationConfig {
    slackWebhook?: string;
    discordWebhook?: string;
    teamsWebhook?: string;
    genericWebhookUrl?: string;
    template?: string;
}
export interface ActionConfig {
    version?: string;
    versionSource: VersionSource;
    versionFile?: string;
    versionPattern: string;
    defaultBump: BumpType;
    initialVersion: string;
    majorKeywords: string[];
    minorKeywords: string[];
    patchKeywords: string[];
    bumpSource: BumpSource;
    tagPrefix: string;
    tagStrategy: TagStrategy;
    channel: string;
    draft: boolean;
    prerelease: boolean;
    makeLatest: MakeLatest;
    targetCommitish?: string;
    discussionCategory?: string;
    ifExists: IfExistsBehavior;
    body?: string;
    bodyPath?: string;
    bodyTemplate?: string;
    appendBody: boolean;
    generateReleaseNotes: boolean;
    name?: string;
    nameTemplate?: string;
    codename: CodenameTheme;
    codenameWords?: string[];
    changelog: boolean;
    updateChangelog: boolean;
    changelogPath: string;
    llmReleaseNotes: boolean;
    llmProvider: LlmProvider;
    llmApiKey?: string;
    llmModel?: string;
    llmPrompt: string;
    llmMaxTokens: number;
    llmContext: LlmContext;
    files?: string;
    workingDirectory: string;
    overwriteFiles: boolean;
    failOnUnmatchedFiles: boolean;
    notifications: NotificationConfig;
    previousReleaseStrategy: PreviousReleaseStrategy;
    previousTag?: string;
    tagMatchPattern?: string;
    dryRun: boolean;
    token: string;
}
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
export declare const DEFAULT_INITIAL_VERSION = "0.1.0";
export declare const DEFAULT_TAG_PREFIX = "v";
export declare const DEFAULT_VERSION_PATTERN = "\"version\":\\s*\"([^\"]+)\"";
export declare const DEFAULT_CHANGELOG_PATH = "CHANGELOG.md";
export declare const SHORT_SHA_LENGTH = 7;
export declare const MAX_CODENAME_RETRIES = 50;
