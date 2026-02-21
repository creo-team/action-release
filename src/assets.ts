import * as core from '@actions/core';
import * as glob from '@actions/glob';
import * as github from '@actions/github';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Asset Upload
// ============================================================================

type Octokit = ReturnType<typeof github.getOctokit>;

export interface UploadAssetsOptions {
  owner: string;
  repo: string;
  releaseId: number;
  patterns: string;
  workingDirectory: string;
  overwrite: boolean;
  failOnUnmatched: boolean;
}

export async function uploadAssets(
  octokit: Octokit,
  options: UploadAssetsOptions
): Promise<string[]> {
  const files = await resolveFiles(
    options.patterns,
    options.workingDirectory
  );

  if (files.length === 0) {
    if (options.failOnUnmatched) {
      throw new Error('No files matched the provided patterns');
    }
    core.info('No files matched — skipping asset upload');
    return [];
  }

  core.info(`Uploading ${files.length} asset(s)`);

  if (options.overwrite) {
    await deleteExistingAssets(octokit, options, files);
  }

  const uploaded: string[] = [];

  for (const filePath of files) {
    const name = path.basename(filePath);
    try {
      await uploadSingleAsset(octokit, options, filePath, name);
      uploaded.push(name);
      core.info(`  Uploaded: ${name}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      core.warning(`  Failed to upload ${name}: ${message}`);
    }
  }

  return uploaded;
}

// ============================================================================
// File Resolution
// ============================================================================

async function resolveFiles(
  patterns: string,
  workingDirectory: string
): Promise<string[]> {
  const lines = patterns
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const absolutePatterns = lines.map((p) =>
    path.isAbsolute(p) ? p : path.join(workingDirectory, p)
  );

  const globber = await glob.create(absolutePatterns.join('\n'));
  const files = await globber.glob();

  return files.filter((f) => fs.statSync(f).isFile());
}

// ============================================================================
// Upload
// ============================================================================

async function uploadSingleAsset(
  octokit: Octokit,
  options: UploadAssetsOptions,
  filePath: string,
  name: string
): Promise<void> {
  const data = fs.readFileSync(filePath);
  const size = fs.statSync(filePath).size;

  await octokit.rest.repos.uploadReleaseAsset({
    owner: options.owner,
    repo: options.repo,
    release_id: options.releaseId,
    name,
    data: data as unknown as string,
    headers: {
      'content-type': 'application/octet-stream',
      'content-length': size,
    },
  });
}

// ============================================================================
// Delete Existing (for overwrite)
// ============================================================================

async function deleteExistingAssets(
  octokit: Octokit,
  options: UploadAssetsOptions,
  newFiles: string[]
): Promise<void> {
  const newNames = new Set(newFiles.map((f) => path.basename(f)));

  const { data: existingAssets } =
    await octokit.rest.repos.listReleaseAssets({
      owner: options.owner,
      repo: options.repo,
      release_id: options.releaseId,
    });

  for (const asset of existingAssets) {
    if (newNames.has(asset.name)) {
      await octokit.rest.repos.deleteReleaseAsset({
        owner: options.owner,
        repo: options.repo,
        asset_id: asset.id,
      });
      core.info(`  Deleted existing asset: ${asset.name}`);
    }
  }
}
