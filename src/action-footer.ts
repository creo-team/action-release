import * as fs from 'fs'
import * as path from 'path'

export const ACTION_REPO = 'creo-team/action-release'
export const ACTION_REPO_URL = 'https://github.com/creo-team/action-release'
export const ACTION_RELEASES_URL = 'https://github.com/creo-team/action-release/releases/tag'

function getActionVersion(): string {
	try {
		const pkgPath = path.join(__dirname, '..', 'package.json')
		const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version?: string }

		return typeof pkg.version === 'string' ? pkg.version : 'unknown'
	} catch {
		return 'unknown'
	}
}

export function buildActionFooter(): string {
	const version = getActionVersion()
	const repoLink = `[${ACTION_REPO}](${ACTION_REPO_URL})`
	const versionLink = `[${version}](${ACTION_RELEASES_URL}/${version})`

	return `---

Created by ${repoLink}@${versionLink}`
}
