export type BumpType = 'major' | 'minor' | 'none' | 'patch';
export declare const BUMP_PRIORITY: Record<BumpType, number>;
export interface SemVer {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
}
export type TagStrategy = 'all' | 'full-and-minor' | 'full';
export type VersionSource = 'auto' | 'file' | 'package-json';
export declare const STABLE_CHANNEL = "stable";
export type IfExistsBehavior = 'fail' | 'skip' | 'update';
export type LlmContext = 'both' | 'commits' | 'diff';
export type LlmProvider = 'anthropic' | 'openai' | 'openrouter';
export type MakeLatest = 'false' | 'legacy' | 'true';
export declare const LLM_DEFAULT_MODELS: Record<LlmProvider, string>;
export declare const LLM_ENDPOINTS: Record<LlmProvider, string>;
export declare const DEFAULT_LLM_MAX_TOKENS = 1024;
export declare const DEFAULT_LLM_PROMPT = "Write release notes from the commit history. Be clear and concise.\nSections: What's New, Fixes, Other (omit empty). Bullet points. Under 200 words.\nPut breaking changes first with a brief warning. Professional tone.";
export interface ActionConfig {
    appendBody: boolean;
    body?: string;
    bodyPath?: string;
    bodyTemplate?: string;
    bumpSource: BumpSource;
    changelog: boolean;
    changelogPath: string;
    channel: string;
    codename: CodenameTheme;
    codenameWords?: string[];
    defaultBump: BumpType;
    discussionCategory?: string;
    draft: boolean;
    dryRun: boolean;
    failOnUnmatchedFiles: boolean;
    files?: string;
    generateReleaseNotes: boolean;
    ifExists: IfExistsBehavior;
    initialVersion: string;
    llmApiKey?: string;
    llmContext: LlmContext;
    llmMaxTokens: number;
    llmModel?: string;
    llmPrompt: string;
    llmProvider: LlmProvider;
    llmReleaseNotes: boolean;
    majorKeywords: string[];
    makeLatest: MakeLatest;
    minorKeywords: string[];
    name?: string;
    nameTemplate?: string;
    notifications: NotificationConfig;
    overwriteFiles: boolean;
    patchKeywords: string[];
    prerelease: boolean;
    previousReleaseStrategy: PreviousReleaseStrategy;
    previousTag?: string;
    tagMatchPattern?: string;
    tagPrefix: string;
    tagStrategy: TagStrategy;
    targetCommitish?: string;
    token: string;
    updateChangelog: boolean;
    version?: string;
    versionFile?: string;
    versionPattern: string;
    versionSource: VersionSource;
    workingDirectory: string;
}
export interface BumpResult {
    reason: string;
    type: BumpType;
}
export type BumpSource = 'all' | 'commits' | 'pr-body' | 'pr-title';
export type CodenameTheme = 'adjective-animal' | 'custom' | 'gemstones' | 'mythology' | 'off' | 'planets' | 'ships' | 'the-office';
export interface NotificationConfig {
    discordWebhook?: string;
    genericWebhookUrl?: string;
    slackWebhook?: string;
    teamsWebhook?: string;
    template?: string;
}
export type PreviousReleaseStrategy = 'latest-release' | 'latest-tag' | 'specific-tag' | 'tag-pattern';
export interface ReleaseResult {
    created: boolean;
    id: number;
    tag: string;
    uploadUrl: string;
    url: string;
}
export interface TemplateVariables {
    actor: string;
    branch: string;
    changelog: string;
    changes: string;
    codename: string;
    commit: string;
    commit_short: string;
    compare_url: string;
    date: string;
    llm_summary: string;
    major: string;
    minor: string;
    owner: string;
    patch: string;
    previous_tag: string;
    release_name: string;
    release_url: string;
    repo: string;
    tag: string;
    version: string;
}
export declare const DEFAULT_INITIAL_VERSION = "0.1.0";
export declare const DEFAULT_TAG_PREFIX = "v";
export declare const DEFAULT_VERSION_PATTERN = "\"version\":\\s*\"([^\"]+)\"";
export declare const DEFAULT_CHANGELOG_PATH = "CHANGELOG.md";
export declare const SHORT_SHA_LENGTH = 7;
export declare const MAX_CODENAME_RETRIES = 50;
