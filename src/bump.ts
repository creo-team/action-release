import { BumpResult, BumpType, BUMP_PRIORITY } from './types';

// ============================================================================
// Conventional Commit Parsing
// ============================================================================

const CONVENTIONAL_COMMIT_REGEX =
  /^(\w+)(?:\([\w-]+\))?(!)?:\s/;

const BREAKING_CHANGE_FOOTER = 'BREAKING CHANGE';

export function detectConventionalBump(message: string): BumpType {
  const match = message.match(CONVENTIONAL_COMMIT_REGEX);

  if (message.includes(BREAKING_CHANGE_FOOTER)) return 'major';
  if (match?.[2] === '!') return 'major';
  if (match?.[1] === 'feat') return 'minor';
  if (match?.[1] === 'fix') return 'patch';

  return 'none';
}

// ============================================================================
// Keyword Matching
// ============================================================================

export function detectKeywordBump(
  text: string,
  majorKeywords: string[],
  minorKeywords: string[],
  patchKeywords: string[]
): BumpType {
  const lowerText = text.toLowerCase();

  for (const keyword of majorKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) return 'major';
  }

  for (const keyword of minorKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) return 'minor';
  }

  for (const keyword of patchKeywords) {
    if (lowerText.includes(keyword.toLowerCase())) return 'patch';
  }

  return 'none';
}

// ============================================================================
// Aggregate Bump Detection
// ============================================================================

export function highestBump(bumps: BumpType[]): BumpType {
  let highest: BumpType = 'none';
  for (const bump of bumps) {
    if (BUMP_PRIORITY[bump] > BUMP_PRIORITY[highest]) {
      highest = bump;
    }
  }
  return highest;
}

export function detectBumpFromMessages(
  messages: string[],
  majorKeywords: string[],
  minorKeywords: string[],
  patchKeywords: string[]
): BumpResult {
  const bumps: BumpType[] = [];
  const reasons: string[] = [];

  for (const message of messages) {
    const conventionalBump = detectConventionalBump(message);
    if (conventionalBump !== 'none') {
      bumps.push(conventionalBump);
      reasons.push(
        `conventional commit "${message.split('\n')[0]}" → ${conventionalBump}`
      );
      continue;
    }

    const keywordBump = detectKeywordBump(
      message,
      majorKeywords,
      minorKeywords,
      patchKeywords
    );
    if (keywordBump !== 'none') {
      bumps.push(keywordBump);
      reasons.push(
        `keyword match in "${message.split('\n')[0]}" → ${keywordBump}`
      );
    }
  }

  const result = highestBump(bumps);
  return {
    type: result,
    reason:
      reasons.length > 0
        ? reasons.join('; ')
        : 'no keywords or conventional commits detected',
  };
}
