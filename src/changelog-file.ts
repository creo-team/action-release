import * as fs from 'fs'

// ============================================================================
// Changelog File Update
// ============================================================================

const CHANGELOG_HEADER = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n'
const CHANGELOG_SEPARATOR = '\n---\n\n'

export function formatChangelogEntry(version: string, date: string, content: string): string {
	return `## [${version}] - ${date}\n\n${content}\n`
}

// ============================================================================
// Formatting
// ============================================================================

export function updateChangelogFile(filePath: string, version: string, date: string, changelogContent: string): void {
	const entry = formatChangelogEntry(version, date, changelogContent)

	if (!fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, `${CHANGELOG_HEADER}${entry}`, 'utf-8')

		return
	}

	const existing = fs.readFileSync(filePath, 'utf-8')
	const updated = insertEntry(existing, entry)
	fs.writeFileSync(filePath, updated, 'utf-8')
}

function insertEntry(existing: string, entry: string): string {
	const headerEnd = existing.indexOf('\n## ')

	if (headerEnd === -1) {
		return `${existing.trimEnd()}\n\n${entry}`
	}

	const header = existing.substring(0, headerEnd)
	const rest = existing.substring(headerEnd)

	return `${header}\n\n${entry}${CHANGELOG_SEPARATOR}${rest.trimStart()}`
}
