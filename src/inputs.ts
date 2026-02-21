import * as core from '@actions/core';
import {
  ActionConfig,
  BumpSource,
  BumpType,
  CodenameTheme,
  DEFAULT_CHANGELOG_PATH,
  DEFAULT_INITIAL_VERSION,
  DEFAULT_LLM_MAX_TOKENS,
  DEFAULT_LLM_PROMPT,
  DEFAULT_TAG_PREFIX,
  DEFAULT_VERSION_PATTERN,
  IfExistsBehavior,
  LlmContext,
  LlmProvider,
  MakeLatest,
  PreviousReleaseStrategy,
  STABLE_CHANNEL,
  TagStrategy,
  VersionSource,
} from './types';

// ============================================================================
// Helpers
// ============================================================================

function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBool(value: string): boolean {
  return value.toLowerCase() === 'true';
}

function parseOptional(value: string): string | undefined {
  return value.trim() || undefined;
}

function parseWordsInput(value: string): string[] | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const words = trimmed.includes('\n')
    ? trimmed.split('\n')
    : trimmed.split(',');

  return words.map((w) => w.trim()).filter(Boolean);
}

// ============================================================================
// Validation
// ============================================================================

const VALID_VERSION_SOURCES: VersionSource[] = [
  'auto',
  'package-json',
  'file',
];
const VALID_BUMP_TYPES: BumpType[] = ['major', 'minor', 'patch', 'none'];
const VALID_BUMP_SOURCES: BumpSource[] = [
  'commits',
  'pr-title',
  'pr-body',
  'all',
];
const VALID_TAG_STRATEGIES: TagStrategy[] = ['full', 'all', 'full-and-minor'];
const VALID_IF_EXISTS: IfExistsBehavior[] = ['skip', 'fail', 'update'];
const VALID_MAKE_LATEST: MakeLatest[] = ['true', 'false', 'legacy'];
const VALID_LLM_PROVIDERS: LlmProvider[] = [
  'openai',
  'anthropic',
  'openrouter',
];
const VALID_LLM_CONTEXTS: LlmContext[] = ['commits', 'diff', 'both'];
const VALID_PREVIOUS_STRATEGIES: PreviousReleaseStrategy[] = [
  'latest-release',
  'latest-tag',
  'tag-pattern',
  'specific-tag',
];
const VALID_CODENAME_THEMES: CodenameTheme[] = [
  'off',
  'adjective-animal',
  'the-office',
  'planets',
  'mythology',
  'gemstones',
  'ships',
  'custom',
];

function validateEnum<T extends string>(
  value: string,
  valid: T[],
  inputName: string
): T {
  const lower = value.toLowerCase().trim() as T;
  if (!valid.includes(lower)) {
    throw new Error(
      `Invalid value "${value}" for ${inputName}. Must be one of: ${valid.join(', ')}`
    );
  }
  return lower;
}

// ============================================================================
// Parse Inputs
// ============================================================================

export function parseInputs(): ActionConfig {
  const versionSource = validateEnum(
    core.getInput('version-source'),
    VALID_VERSION_SOURCES,
    'version-source'
  );

  const defaultBump = validateEnum(
    core.getInput('default-bump'),
    VALID_BUMP_TYPES,
    'default-bump'
  );

  const bumpSource = validateEnum(
    core.getInput('bump-source'),
    VALID_BUMP_SOURCES,
    'bump-source'
  );

  const tagStrategy = validateEnum(
    core.getInput('tag-strategy'),
    VALID_TAG_STRATEGIES,
    'tag-strategy'
  );

  const ifExists = validateEnum(
    core.getInput('if-exists'),
    VALID_IF_EXISTS,
    'if-exists'
  );

  const makeLatest = validateEnum(
    core.getInput('make-latest'),
    VALID_MAKE_LATEST,
    'make-latest'
  );

  const llmProvider = validateEnum(
    core.getInput('llm-provider'),
    VALID_LLM_PROVIDERS,
    'llm-provider'
  );

  const llmContext = validateEnum(
    core.getInput('llm-context'),
    VALID_LLM_CONTEXTS,
    'llm-context'
  );

  const previousReleaseStrategy = validateEnum(
    core.getInput('previous-release-strategy'),
    VALID_PREVIOUS_STRATEGIES,
    'previous-release-strategy'
  );

  const codename = validateEnum(
    core.getInput('codename'),
    VALID_CODENAME_THEMES,
    'codename'
  );

  const channel = core.getInput('channel') || STABLE_CHANNEL;
  const llmReleaseNotes = parseBool(core.getInput('llm-release-notes'));

  if (llmReleaseNotes && !core.getInput('llm-api-key')) {
    core.warning(
      'llm-release-notes is enabled but no llm-api-key provided. LLM notes will be skipped.'
    );
  }

  if (versionSource === 'file' && !core.getInput('version-file')) {
    throw new Error(
      'version-source is "file" but no version-file input was provided.'
    );
  }

  if (codename === 'custom' && !core.getInput('codename-words')) {
    throw new Error(
      'codename is "custom" but no codename-words input was provided.'
    );
  }

  const llmMaxTokensRaw = core.getInput('llm-max-tokens');
  const llmMaxTokens = llmMaxTokensRaw
    ? parseInt(llmMaxTokensRaw, 10)
    : DEFAULT_LLM_MAX_TOKENS;

  if (isNaN(llmMaxTokens) || llmMaxTokens <= 0) {
    throw new Error(
      `Invalid llm-max-tokens: "${llmMaxTokensRaw}". Must be a positive integer.`
    );
  }

  return {
    version: parseOptional(core.getInput('version')),
    versionSource,
    versionFile: parseOptional(core.getInput('version-file')),
    versionPattern:
      core.getInput('version-pattern') || DEFAULT_VERSION_PATTERN,
    defaultBump,
    initialVersion: core.getInput('initial-version') || DEFAULT_INITIAL_VERSION,

    majorKeywords: parseCommaSeparated(
      core.getInput('major-keywords') || 'BREAKING CHANGE,major,!:'
    ),
    minorKeywords: parseCommaSeparated(
      core.getInput('minor-keywords') || 'feat,feature,minor'
    ),
    patchKeywords: parseCommaSeparated(
      core.getInput('patch-keywords') || 'fix,bug,patch,chore,refactor'
    ),
    bumpSource,

    tagPrefix: core.getInput('tag-prefix') ?? DEFAULT_TAG_PREFIX,
    tagStrategy,

    channel,

    draft: parseBool(core.getInput('draft')),
    prerelease:
      parseBool(core.getInput('prerelease')) || channel !== STABLE_CHANNEL,
    makeLatest,
    targetCommitish: parseOptional(core.getInput('target-commitish')),
    discussionCategory: parseOptional(core.getInput('discussion-category')),
    ifExists,

    body: parseOptional(core.getInput('body')),
    bodyPath: parseOptional(core.getInput('body-path')),
    bodyTemplate: parseOptional(core.getInput('body-template')),
    appendBody: parseBool(core.getInput('append-body')),
    generateReleaseNotes: parseBool(core.getInput('generate-release-notes')),

    name: parseOptional(core.getInput('name')),
    nameTemplate: parseOptional(core.getInput('name-template')),
    codename,
    codenameWords: parseWordsInput(core.getInput('codename-words')),

    changelog: parseBool(core.getInput('changelog')),
    updateChangelog: parseBool(core.getInput('update-changelog')),
    changelogPath: core.getInput('changelog-path') || DEFAULT_CHANGELOG_PATH,

    llmReleaseNotes,
    llmProvider,
    llmApiKey: parseOptional(core.getInput('llm-api-key')),
    llmModel: parseOptional(core.getInput('llm-model')),
    llmPrompt: core.getInput('llm-prompt') || DEFAULT_LLM_PROMPT,
    llmMaxTokens,
    llmContext,

    files: parseOptional(core.getInput('files')),
    workingDirectory: core.getInput('working-directory') || '.',
    overwriteFiles: parseBool(
      core.getInput('overwrite-files') || 'true'
    ),
    failOnUnmatchedFiles: parseBool(core.getInput('fail-on-unmatched-files')),

    notifications: {
      slackWebhook: parseOptional(core.getInput('slack-webhook')),
      discordWebhook: parseOptional(core.getInput('discord-webhook')),
      teamsWebhook: parseOptional(core.getInput('teams-webhook')),
      genericWebhookUrl: parseOptional(core.getInput('webhook-url')),
      template: parseOptional(core.getInput('notification-template')),
    },

    previousReleaseStrategy,
    previousTag: parseOptional(core.getInput('previous-tag')),
    tagMatchPattern: parseOptional(core.getInput('tag-match-pattern')),

    dryRun: parseBool(core.getInput('dry-run')),
    token: core.getInput('token') || process.env.GITHUB_TOKEN || '',
  };
}
