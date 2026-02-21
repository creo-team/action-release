import { SemVer, TagStrategy } from './types';

// ============================================================================
// Tag Generation
// ============================================================================

export function formatTag(
  version: SemVer,
  prefix: string
): string {
  const base = `${version.major}.${version.minor}.${version.patch}`;
  const versionStr = version.prerelease
    ? `${base}-${version.prerelease}`
    : base;
  return `${prefix}${versionStr}`;
}

export function formatMajorTag(
  version: SemVer,
  prefix: string
): string {
  return `${prefix}${version.major}`;
}

export function formatMinorTag(
  version: SemVer,
  prefix: string
): string {
  return `${prefix}${version.major}.${version.minor}`;
}

// ============================================================================
// Strategy
// ============================================================================

export function getTagsForStrategy(
  version: SemVer,
  prefix: string,
  strategy: TagStrategy
): string[] {
  const fullTag = formatTag(version, prefix);

  switch (strategy) {
    case 'full':
      return [fullTag];
    case 'all':
      return [
        fullTag,
        formatMinorTag(version, prefix),
        formatMajorTag(version, prefix),
      ];
    case 'full-and-minor':
      return [fullTag, formatMinorTag(version, prefix)];
  }
}

// ============================================================================
// Parsing
// ============================================================================

export function stripPrefix(tag: string, prefix: string): string {
  return tag.startsWith(prefix) ? tag.slice(prefix.length) : tag;
}

export function buildCompareUrl(
  owner: string,
  repo: string,
  previousTag: string,
  newTag: string
): string {
  return `https://github.com/${owner}/${repo}/compare/${previousTag}...${newTag}`;
}
