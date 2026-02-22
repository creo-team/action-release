import * as core from '@actions/core'
import * as glob from '@actions/glob'
import type * as github from '@actions/github'
import * as fs from 'fs'
import * as path from 'path'

export interface UploadAssetsOptions {
	failOnUnmatched: boolean
	overwrite: boolean
	owner: string
	patterns: string
	releaseId: number
	repo: string
	workingDirectory: string
}

type Octokit = ReturnType<typeof github.getOctokit>

export async function uploadAssets(octokit: Octokit, options: UploadAssetsOptions): Promise<string[]> {
	const files = await resolveFiles(options.patterns, options.workingDirectory)

	if (files.length === 0) {
		if (options.failOnUnmatched) {
			throw new Error('No files matched the provided patterns')
		}
		core.info('No files matched — skipping asset upload')

		return []
	}

	core.info(`Uploading ${files.length} asset(s)`)

	if (options.overwrite) {
		await deleteExistingAssets(octokit, options, files)
	}

	const uploaded: string[] = []

	for (const filePath of files) {
		const name = path.basename(filePath)
		try {
			await uploadSingleAsset(octokit, options, filePath, name)
			uploaded.push(name)
			core.info(`  Uploaded: ${name}`)
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			core.warning(`  Failed to upload ${name}: ${message}`)
		}
	}

	return uploaded
}

async function deleteExistingAssets(octokit: Octokit, options: UploadAssetsOptions, newFiles: string[]): Promise<void> {
	const newNames = new Set(newFiles.map((f) => path.basename(f)))

	const { data: existingAssets } = await octokit.rest.repos.listReleaseAssets({
		owner: options.owner,
		release_id: options.releaseId,
		repo: options.repo,
	})

	for (const asset of existingAssets) {
		if (newNames.has(asset.name)) {
			await octokit.rest.repos.deleteReleaseAsset({
				asset_id: asset.id,
				owner: options.owner,
				repo: options.repo,
			})
			core.info(`  Deleted existing asset: ${asset.name}`)
		}
	}
}

async function resolveFiles(patterns: string, workingDirectory: string): Promise<string[]> {
	const lines = patterns
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)

	const absolutePatterns = lines.map((p) => (path.isAbsolute(p) ? p : path.join(workingDirectory, p)))

	const globber = await glob.create(absolutePatterns.join('\n'))
	const files = await globber.glob()

	return files.filter((f) => fs.statSync(f).isFile())
}

async function uploadSingleAsset(
	octokit: Octokit,
	options: UploadAssetsOptions,
	filePath: string,
	name: string,
): Promise<void> {
	const data = fs.readFileSync(filePath)
	const size = fs.statSync(filePath).size

	await octokit.rest.repos.uploadReleaseAsset({
		data: data as unknown as string,
		headers: {
			'content-length': size,
			'content-type': 'application/octet-stream',
		},
		name,
		owner: options.owner,
		release_id: options.releaseId,
		repo: options.repo,
	})
}
