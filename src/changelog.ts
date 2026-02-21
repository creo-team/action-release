// ============================================================================
// Conventional Changelog Generation
// ============================================================================

interface ChangelogSection {
	emoji: string
	title: string
	types: string[]
}

const CHANGELOG_SECTIONS: ChangelogSection[] = [
	{ emoji: '💥', title: 'Breaking Changes', types: ['breaking'] },
	{ emoji: '✨', title: 'Features', types: ['feat'] },
	{ emoji: '🐛', title: 'Bug Fixes', types: ['fix'] },
	{ emoji: '⚡', title: 'Performance', types: ['perf'] },
	{ emoji: '📚', title: 'Documentation', types: ['docs'] },
	{ emoji: '♻️', title: 'Refactoring', types: ['refactor'] },
	{ emoji: '🧪', title: 'Testing', types: ['test'] },
	{ emoji: '🏗️', title: 'Build & CI', types: ['build', 'ci'] },
	{ emoji: '🔧', title: 'Chores', types: ['chore'] },
	{ emoji: '💄', title: 'Styles', types: ['style'] },
]

interface ParsedCommit {
	breaking: boolean
	description: string
	hash?: string
	scope?: string
	type: string
}

const COMMIT_REGEX = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)/

// ============================================================================
// Parsing
// ============================================================================

export function formatRawChanges(commitMessages: string[], commitHashes?: string[]): string {
	return commitMessages
		.map((msg, i) => {
			const firstLine = msg.split('\n')[0].trim()
			const hash = commitHashes?.[i]?.substring(0, 7)

			return hash ? `- ${firstLine} (${hash})` : `- ${firstLine}`
		})
		.join('\n')
}

// ============================================================================
// Generation
// ============================================================================

export function generateChangelog(commitMessages: string[], commitHashes?: string[]): string {
	const parsed: ParsedCommit[] = []

	for (let i = 0; i < commitMessages.length; i++) {
		const commit = parseCommitMessage(commitMessages[i])
		if (commit) {
			commit.hash = commitHashes?.[i]?.substring(0, 7)
			parsed.push(commit)
		}
	}

	if (parsed.length === 0) {
		return ''
	}

	const sections: string[] = []

	for (const section of CHANGELOG_SECTIONS) {
		const commits = parsed.filter((c) => {
			if (section.types.includes('breaking')) return c.breaking

			return section.types.includes(c.type) && !c.breaking
		})

		if (commits.length === 0) continue

		const lines = commits.map((c) => {
			const scope = c.scope ? `**${c.scope}:** ` : ''
			const hash = c.hash ? ` (${c.hash})` : ''

			return `- ${scope}${c.description}${hash}`
		})

		sections.push(`### ${section.emoji} ${section.title}\n\n${lines.join('\n')}`)
	}

	const uncategorized = parsed.filter((c) => {
		return !CHANGELOG_SECTIONS.some((s) => s.types.includes(c.type) || (s.types.includes('breaking') && c.breaking))
	})

	if (uncategorized.length > 0) {
		const lines = uncategorized.map((c) => {
			const hash = c.hash ? ` (${c.hash})` : ''

			return `- ${c.description}${hash}`
		})
		sections.push(`### Other Changes\n\n${lines.join('\n')}`)
	}

	return sections.join('\n\n')
}

// ============================================================================
// Raw Changes (non-conventional)
// ============================================================================

export function parseCommitMessage(message: string): null | ParsedCommit {
	const firstLine = message.split('\n')[0].trim()
	const match = COMMIT_REGEX.exec(firstLine)

	if (!match) return null

	const breaking = match[3] === '!' || message.includes('BREAKING CHANGE')

	return {
		breaking,
		description: match[4],
		scope: match[2],
		type: match[1],
	}
}
