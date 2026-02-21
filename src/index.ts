import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
import { parseInputs } from './inputs';
import {
  parseSemVer,
  formatSemVer,
  bumpVersion,
  readVersionFromPackageJson,
  readVersionFromFile,
  applyChannel,
} from './version';
import { detectBumpFromMessages } from './bump';
import { getTagsForStrategy, buildCompareUrl } from './tags';
import { findPreviousTag } from './previous-release';
import { renderTemplate, buildTemplateVariables } from './template';
import { generateChangelog, formatRawChanges } from './changelog';
import { updateChangelogFile } from './changelog-file';
import { generateCodename, getExistingReleaseNames } from './codename';
import { generateLlmReleaseNotes } from './llm';
import { createRelease, createOrUpdateTag } from './release';
import { uploadAssets } from './assets';
import { sendNotifications } from './notifications';
import { writeStepSummary } from './summary';
import { SHORT_SHA_LENGTH, STABLE_CHANNEL, SemVer } from './types';

// ============================================================================
// Main
// ============================================================================

async function run(): Promise<void> {
  const config = parseInputs();
  const octokit = github.getOctokit(config.token);
  const { owner, repo } = github.context.repo;
  const sha = github.context.sha;

  // ============================================================================
  // 1. Find previous release
  // ============================================================================

  const previousTag = await findPreviousTag(octokit, owner, repo, config.previousReleaseStrategy, {
    specificTag: config.previousTag,
    matchPattern: config.tagMatchPattern,
    tagPrefix: config.tagPrefix,
  });

  core.info(previousTag ? `Previous tag: ${previousTag}` : 'No previous tag found');

  // ============================================================================
  // 2. Collect commits since previous tag
  // ============================================================================

  const { messages, hashes, diff } = await getCommitData(
    octokit, owner, repo, sha, previousTag, config.llmContext === 'diff' || config.llmContext === 'both'
  );

  // ============================================================================
  // 3. Resolve version
  // ============================================================================

  let version: SemVer;

  if (config.version) {
    const parsed = parseSemVer(config.version);
    if (!parsed) throw new Error(`Invalid version: ${config.version}`);
    version = parsed;
  } else switch (config.versionSource) {
    case 'package-json': {
      const versionStr = readVersionFromPackageJson('package.json');
      version = parseSemVer(versionStr)!;
      break;
    }

    case 'file': {
      const versionStr = readVersionFromFile(config.versionFile!, config.versionPattern);
      version = parseSemVer(versionStr)!;
      break;
    }

    case 'auto': {
      if (!previousTag) {
        version = parseSemVer(config.initialVersion)!;
        core.info(`No previous tag — using initial version ${config.initialVersion}`);
      } else {
        const previousVersion = parseSemVer(previousTag.replace(config.tagPrefix, ''));
        if (!previousVersion) {
          throw new Error(`Cannot parse previous tag "${previousTag}" as semver`);
        }

        const bumpTexts = collectBumpTexts(config.bumpSource, messages);
        const bumpResult = detectBumpFromMessages(
          bumpTexts, config.majorKeywords, config.minorKeywords, config.patchKeywords
        );

        const bumpType = bumpResult.type === 'none' ? config.defaultBump : bumpResult.type;
        core.info(`Bump: ${bumpType} (${bumpResult.reason})`);

        if (bumpType === 'none') {
          core.info('No bump detected and default-bump is "none" — skipping release');
          setSkippedOutputs();
          return;
        }

        version = bumpVersion(previousVersion, bumpType);
      }
      break;
    }
  }

  // ============================================================================
  // 4. Apply channel (pre-release)
  // ============================================================================

  if (config.channel !== STABLE_CHANNEL) {
    const channelNumber = await getNextChannelNumber(
      octokit, owner, repo, version, config.channel, config.tagPrefix
    );
    version = applyChannel(version, config.channel, channelNumber);
  }

  const versionStr = formatSemVer(version);
  const tags = getTagsForStrategy(version, config.tagPrefix, config.tagStrategy);
  const primaryTag = tags[0];

  core.info(`Version: ${versionStr}`);
  core.info(`Tags: ${tags.join(', ')}`);

  // ============================================================================
  // 5. Generate changelog
  // ============================================================================

  const changelogMd = config.changelog
    ? generateChangelog(messages, hashes)
    : '';

  const rawChanges = formatRawChanges(messages, hashes);

  // ============================================================================
  // 6. Generate codename
  // ============================================================================

  let codename = '';
  if (config.codename !== 'off') {
    const existingNames = await getExistingReleaseNames(octokit, owner, repo);
    codename = generateCodename(config.codename, existingNames, config.codenameWords);
    core.info(`Codename: ${codename}`);
  }

  // ============================================================================
  // 7. Generate LLM summary
  // ============================================================================

  let llmSummary = '';
  if (config.llmReleaseNotes && config.llmApiKey) {
    llmSummary = await generateLlmReleaseNotes(
      {
        provider: config.llmProvider,
        apiKey: config.llmApiKey,
        model: config.llmModel,
        systemPrompt: config.llmPrompt,
        maxTokens: config.llmMaxTokens,
      },
      {
        commitMessages: messages,
        diff: diff ?? undefined,
        previousTag: previousTag ?? '',
        newTag: primaryTag,
        repo: `${owner}/${repo}`,
      }
    );
  }

  // ============================================================================
  // 8. Build template variables
  // ============================================================================

  const compareUrl = previousTag
    ? buildCompareUrl(owner, repo, previousTag, primaryTag)
    : '';

  const templateVars = buildTemplateVariables({
    tag: primaryTag,
    version: versionStr,
    major: String(version.major),
    minor: String(version.minor),
    patch: String(version.patch),
    commit: sha,
    commit_short: sha.substring(0, SHORT_SHA_LENGTH),
    previous_tag: previousTag ?? '',
    compare_url: compareUrl,
    changes: rawChanges,
    changelog: changelogMd,
    llm_summary: llmSummary,
    codename,
    date: new Date().toISOString().split('T')[0],
    repo: `${owner}/${repo}`,
    owner,
    branch: github.context.ref.replace('refs/heads/', ''),
    actor: github.context.actor,
    release_url: '',
    release_name: '',
  });

  // ============================================================================
  // 9. Build release body
  // ============================================================================

  const DEFAULT_BODY_TEMPLATE =
    '## What\'s Changed\n\n{{changelog}}\n\n**Full Changelog**: {{compare_url}}';

  let body = '';
  if (config.bodyTemplate) {
    body = renderTemplate(config.bodyTemplate, templateVars);
  } else if (config.bodyPath) {
    body = fs.readFileSync(config.bodyPath, 'utf-8');
    body = renderTemplate(body, templateVars);
  } else if (config.body) {
    body = renderTemplate(config.body, templateVars);
  } else if (config.changelog) {
    body = renderTemplate(DEFAULT_BODY_TEMPLATE, templateVars);
  }

  // ============================================================================
  // 10. Build release name
  // ============================================================================

  let releaseName: string;
  if (config.name) {
    releaseName = renderTemplate(config.name, templateVars);
  } else if (config.nameTemplate) {
    releaseName = renderTemplate(config.nameTemplate, templateVars);
  } else {
    releaseName = primaryTag;
  }

  templateVars.release_name = releaseName;

  // ============================================================================
  // 11. Dry run check
  // ============================================================================

  if (config.dryRun) {
    core.info('Dry run — no tags or releases will be created');
    setOutputs(primaryTag, versionStr, version, tags, previousTag, compareUrl, codename, releaseName, changelogMd, llmSummary, body, true, false);
    await writeStepSummary(templateVars, {
      dryRun: true,
      created: false,
      tags,
      changelog: changelogMd || undefined,
      llmSummary: llmSummary || undefined,
      codename: codename || undefined,
    });
    return;
  }

  // ============================================================================
  // 12. Create tags
  // ============================================================================

  for (const tag of tags) {
    await createOrUpdateTag(octokit, owner, repo, tag, sha);
  }

  // ============================================================================
  // 13. Create release
  // ============================================================================

  const releaseResult = await createRelease(octokit, {
    owner,
    repo,
    tag: primaryTag,
    name: releaseName,
    body,
    draft: config.draft,
    prerelease: config.prerelease,
    makeLatest: config.makeLatest,
    targetCommitish: config.targetCommitish,
    discussionCategory: config.discussionCategory,
    generateReleaseNotes: config.generateReleaseNotes,
    ifExists: config.ifExists,
  });

  templateVars.release_url = releaseResult.url;

  // ============================================================================
  // 14. Upload assets
  // ============================================================================

  let uploadedAssets: string[] = [];
  if (config.files) {
    uploadedAssets = await uploadAssets(octokit, {
      owner,
      repo,
      releaseId: releaseResult.id,
      patterns: config.files,
      workingDirectory: config.workingDirectory,
      overwrite: config.overwriteFiles,
      failOnUnmatched: config.failOnUnmatchedFiles,
    });
  }

  // ============================================================================
  // 15. Update changelog file
  // ============================================================================

  if (config.updateChangelog) {
    const changelogContent = changelogMd || rawChanges;
    updateChangelogFile(
      config.changelogPath,
      versionStr,
      templateVars.date,
      changelogContent
    );
    core.info(`Updated ${config.changelogPath}`);
  }

  // ============================================================================
  // 16. Send notifications
  // ============================================================================

  const hasNotifications =
    config.notifications.slackWebhook ||
    config.notifications.discordWebhook ||
    config.notifications.teamsWebhook ||
    config.notifications.genericWebhookUrl;

  if (hasNotifications && releaseResult.created) {
    await sendNotifications(config.notifications, templateVars);
  }

  // ============================================================================
  // 17. Write step summary
  // ============================================================================

  await writeStepSummary(templateVars, {
    dryRun: false,
    created: releaseResult.created,
    tags,
    changelog: changelogMd || undefined,
    llmSummary: llmSummary || undefined,
    codename: codename || undefined,
    uploadedAssets: uploadedAssets.length > 0 ? uploadedAssets : undefined,
  });

  // ============================================================================
  // 18. Set outputs
  // ============================================================================

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
    releaseResult.uploadUrl
  );
}

// ============================================================================
// Helpers
// ============================================================================

function collectBumpTexts(bumpSource: string, messages: string[]): string[] {
  const context = github.context;

  switch (bumpSource) {
    case 'pr-title': {
      const prTitle = context.payload.pull_request?.title;
      return prTitle ? [prTitle] : messages;
    }
    case 'pr-body': {
      const prBody = context.payload.pull_request?.body;
      return prBody ? [prBody] : messages;
    }
    case 'all': {
      const texts = [...messages];
      const pr = context.payload.pull_request;
      if (pr?.title) texts.push(pr.title);
      if (pr?.body) texts.push(pr.body);
      return texts;
    }
    default:
      return messages;
  }
}

async function getCommitData(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  headSha: string,
  previousTag: string | null,
  includeDiff: boolean
): Promise<{ messages: string[]; hashes: string[]; diff: string | null }> {
  if (!previousTag) {
    return { messages: [], hashes: [], diff: null };
  }

  try {
    const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
      owner,
      repo,
      basehead: `${previousTag}...${headSha}`,
    });

    const messages = data.commits.map((c) => c.commit.message);
    const hashes = data.commits.map((c) => c.sha);

    let diff: string | null = null;
    if (includeDiff) {
      const { data: diffData } = await octokit.rest.repos.compareCommitsWithBasehead({
        owner,
        repo,
        basehead: `${previousTag}...${headSha}`,
        mediaType: { format: 'diff' },
      });
      diff = diffData as unknown as string;
    }

    return { messages, hashes, diff };
  } catch {
    core.warning(`Could not compare ${previousTag}...${headSha}`);
    return { messages: [], hashes: [], diff: null };
  }
}

async function getNextChannelNumber(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  version: SemVer,
  channel: string,
  prefix: string
): Promise<number> {
  const pattern = `${prefix}${version.major}.${version.minor}.${version.patch}-${channel}.`;

  try {
    const { data: tags } = await octokit.rest.repos.listTags({
      owner,
      repo,
      per_page: 100,
    });

    let highest = 0;
    for (const tag of tags) {
      if (tag.name.startsWith(pattern)) {
        const numStr = tag.name.substring(pattern.length);
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > highest) {
          highest = num;
        }
      }
    }

    return highest + 1;
  } catch {
    return 1;
  }
}

function setOutputs(
  tag: string,
  version: string,
  semver: SemVer,
  tags: string[],
  previousTag: string | null,
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
  uploadUrl?: string
): void {
  core.setOutput('tag', tag);
  core.setOutput('version', version);
  core.setOutput('major', String(semver.major));
  core.setOutput('minor', String(semver.minor));
  core.setOutput('patch', String(semver.patch));
  core.setOutput('tags', JSON.stringify(tags));
  core.setOutput('previous-tag', previousTag ?? '');
  core.setOutput('compare-url', compareUrl);
  core.setOutput('url', url ?? '');
  core.setOutput('id', String(id ?? ''));
  core.setOutput('upload-url', uploadUrl ?? '');
  core.setOutput('created', String(created));
  core.setOutput('codename', codename);
  core.setOutput('release-name', releaseName);
  core.setOutput('changelog', changelog);
  core.setOutput('llm-summary', llmSummary);
  core.setOutput('body', body);
  core.setOutput('dry-run', String(dryRun));
}

function setSkippedOutputs(): void {
  core.setOutput('created', 'false');
  core.setOutput('dry-run', 'false');
  core.setOutput('tag', '');
  core.setOutput('version', '');
}

// ============================================================================
// Entry
// ============================================================================

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  core.setFailed(message);
});
