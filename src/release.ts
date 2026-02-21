import * as core from '@actions/core';
import * as github from '@actions/github';
import { IfExistsBehavior, MakeLatest, ReleaseResult } from './types';

// ============================================================================
// GitHub Release Operations
// ============================================================================

type Octokit = ReturnType<typeof github.getOctokit>;

export interface CreateReleaseOptions {
  owner: string;
  repo: string;
  tag: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  makeLatest: MakeLatest;
  targetCommitish?: string;
  discussionCategory?: string;
  generateReleaseNotes: boolean;
  ifExists: IfExistsBehavior;
}

// ============================================================================
// Create Release
// ============================================================================

export async function createRelease(
  octokit: Octokit,
  options: CreateReleaseOptions
): Promise<ReleaseResult> {
  const existing = await findExistingRelease(
    octokit,
    options.owner,
    options.repo,
    options.tag
  );

  if (existing) {
    return handleExisting(octokit, options, existing);
  }

  return createNewRelease(octokit, options);
}

// ============================================================================
// Create New
// ============================================================================

async function createNewRelease(
  octokit: Octokit,
  options: CreateReleaseOptions
): Promise<ReleaseResult> {
  core.info(`Creating release ${options.tag}`);

  const { data } = await octokit.rest.repos.createRelease({
    owner: options.owner,
    repo: options.repo,
    tag_name: options.tag,
    name: options.name,
    body: options.body,
    draft: options.draft,
    prerelease: options.prerelease,
    make_latest: options.makeLatest,
    target_commitish: options.targetCommitish,
    discussion_category_name: options.discussionCategory,
    generate_release_notes: options.generateReleaseNotes,
  });

  return {
    id: data.id,
    url: data.html_url,
    uploadUrl: data.upload_url,
    tag: data.tag_name,
    created: true,
  };
}

// ============================================================================
// Handle Existing
// ============================================================================

interface ExistingRelease {
  id: number;
  url: string;
  uploadUrl: string;
  tag: string;
}

async function handleExisting(
  octokit: Octokit,
  options: CreateReleaseOptions,
  existing: ExistingRelease
): Promise<ReleaseResult> {
  switch (options.ifExists) {
    case 'skip':
      core.info(`Release ${options.tag} already exists — skipping`);
      return { ...existing, created: false };

    case 'fail':
      throw new Error(
        `Release ${options.tag} already exists and if-exists is "fail"`
      );

    case 'update':
      return updateExistingRelease(octokit, options, existing.id);
  }
}

async function updateExistingRelease(
  octokit: Octokit,
  options: CreateReleaseOptions,
  releaseId: number
): Promise<ReleaseResult> {
  core.info(`Updating existing release ${options.tag}`);

  const { data } = await octokit.rest.repos.updateRelease({
    owner: options.owner,
    repo: options.repo,
    release_id: releaseId,
    name: options.name,
    body: options.body,
    draft: options.draft,
    prerelease: options.prerelease,
    make_latest: options.makeLatest,
  });

  return {
    id: data.id,
    url: data.html_url,
    uploadUrl: data.upload_url,
    tag: data.tag_name,
    created: false,
  };
}

// ============================================================================
// Find Existing
// ============================================================================

async function findExistingRelease(
  octokit: Octokit,
  owner: string,
  repo: string,
  tag: string
): Promise<ExistingRelease | null> {
  try {
    const { data } = await octokit.rest.repos.getReleaseByTag({
      owner,
      repo,
      tag,
    });

    return {
      id: data.id,
      url: data.html_url,
      uploadUrl: data.upload_url,
      tag: data.tag_name,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Tag Operations
// ============================================================================

export async function createOrUpdateTag(
  octokit: Octokit,
  owner: string,
  repo: string,
  tag: string,
  sha: string
): Promise<void> {
  const ref = `refs/tags/${tag}`;

  try {
    await octokit.rest.git.getRef({
      owner,
      repo,
      ref,
    });

    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref,
      sha,
      force: true,
    });

    core.info(`Updated tag ${tag} → ${sha.substring(0, 7)}`);
  } catch {
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref,
      sha,
    });

    core.info(`Created tag ${tag} → ${sha.substring(0, 7)}`);
  }
}
