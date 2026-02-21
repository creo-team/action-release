// ============================================================================
// Conventional Changelog Generation
// ============================================================================

interface ChangelogSection {
  title: string;
  emoji: string;
  types: string[];
}

const CHANGELOG_SECTIONS: ChangelogSection[] = [
  { title: 'Breaking Changes', emoji: '💥', types: ['breaking'] },
  { title: 'Features', emoji: '✨', types: ['feat'] },
  { title: 'Bug Fixes', emoji: '🐛', types: ['fix'] },
  { title: 'Performance', emoji: '⚡', types: ['perf'] },
  { title: 'Documentation', emoji: '📚', types: ['docs'] },
  { title: 'Refactoring', emoji: '♻️', types: ['refactor'] },
  { title: 'Testing', emoji: '🧪', types: ['test'] },
  { title: 'Build & CI', emoji: '🏗️', types: ['build', 'ci'] },
  { title: 'Chores', emoji: '🔧', types: ['chore'] },
  { title: 'Styles', emoji: '💄', types: ['style'] },
];

interface ParsedCommit {
  type: string;
  scope?: string;
  description: string;
  breaking: boolean;
  hash?: string;
}

const COMMIT_REGEX = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)/;

// ============================================================================
// Parsing
// ============================================================================

export function parseCommitMessage(message: string): ParsedCommit | null {
  const firstLine = message.split('\n')[0].trim();
  const match = firstLine.match(COMMIT_REGEX);

  if (!match) return null;

  const breaking =
    match[3] === '!' || message.includes('BREAKING CHANGE');

  return {
    type: match[1],
    scope: match[2],
    description: match[4],
    breaking,
  };
}

// ============================================================================
// Generation
// ============================================================================

export function generateChangelog(
  commitMessages: string[],
  commitHashes?: string[]
): string {
  const parsed: ParsedCommit[] = [];

  for (let i = 0; i < commitMessages.length; i++) {
    const commit = parseCommitMessage(commitMessages[i]);
    if (commit) {
      commit.hash = commitHashes?.[i]?.substring(0, 7);
      parsed.push(commit);
    }
  }

  if (parsed.length === 0) {
    return '';
  }

  const sections: string[] = [];

  for (const section of CHANGELOG_SECTIONS) {
    const commits = parsed.filter((c) => {
      if (section.types.includes('breaking')) return c.breaking;
      return section.types.includes(c.type) && !c.breaking;
    });

    if (commits.length === 0) continue;

    const lines = commits.map((c) => {
      const scope = c.scope ? `**${c.scope}:** ` : '';
      const hash = c.hash ? ` (${c.hash})` : '';
      return `- ${scope}${c.description}${hash}`;
    });

    sections.push(`### ${section.emoji} ${section.title}\n\n${lines.join('\n')}`);
  }

  const uncategorized = parsed.filter((c) => {
    return !CHANGELOG_SECTIONS.some((s) =>
      s.types.includes(c.type) || (s.types.includes('breaking') && c.breaking)
    );
  });

  if (uncategorized.length > 0) {
    const lines = uncategorized.map((c) => {
      const hash = c.hash ? ` (${c.hash})` : '';
      return `- ${c.description}${hash}`;
    });
    sections.push(`### Other Changes\n\n${lines.join('\n')}`);
  }

  return sections.join('\n\n');
}

// ============================================================================
// Raw Changes (non-conventional)
// ============================================================================

export function formatRawChanges(
  commitMessages: string[],
  commitHashes?: string[]
): string {
  return commitMessages
    .map((msg, i) => {
      const firstLine = msg.split('\n')[0].trim();
      const hash = commitHashes?.[i]?.substring(0, 7);
      return hash ? `- ${firstLine} (${hash})` : `- ${firstLine}`;
    })
    .join('\n');
}
