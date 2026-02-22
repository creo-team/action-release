interface ChangelogSection {
	title: string
	types: string[]
}

const CHANGELOG_SECTIONS: ChangelogSection[] = [
	{ title: 'Breaking Changes', types: ['breaking'] },
	{ title: 'Features', types: ['feat'] },
	{ title: 'Bug Fixes', types: ['fix'] },
	{ title: 'Performance', types: ['perf'] },
	{ title: 'Documentation', types: ['docs'] },
	{ title: 'Refactoring', types: ['refactor'] },
	{ title: 'Testing', types: ['test'] },
	{ title: 'Build & CI', types: ['build', 'ci'] },
	{ title: 'Chores', types: ['chore'] },
	{ title: 'Styles', types: ['style'] },
]

interface ParsedCommit {
	breaking: boolean
	description: string
	hash?: string
	scope?: string
	type: string
}

const COMMIT_REGEX = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)/

export function formatRawChanges(commitMessages: string[], commitHashes?: string[]): string {
	return commitMessages
		.map((msg, i) => {
			const firstLine = msg.split('\n')[0].trim()
			const hash = commitHashes?.[i]?.substring(0, 7)

			return hash ? `- ${firstLine} (${hash})` : `- ${firstLine}`
		})
		.join('\n')
}

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

		sections.push(`### ${section.title}\n\n${lines.join('\n')}`)
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
