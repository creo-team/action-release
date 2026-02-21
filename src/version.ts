import * as fs from 'fs';
import { SemVer } from './types';

// ============================================================================
// Parsing
// ============================================================================

const SEMVER_REGEX =
  /^v?(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?$/;

export function parseSemVer(version: string): SemVer | null {
  const match = version.trim().match(SEMVER_REGEX);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
  };
}

export function formatSemVer(version: SemVer): string {
  const base = `${version.major}.${version.minor}.${version.patch}`;
  return version.prerelease ? `${base}-${version.prerelease}` : base;
}

export function isValidSemVer(version: string): boolean {
  return parseSemVer(version) !== null;
}

// ============================================================================
// Bump
// ============================================================================

export function bumpVersion(
  current: SemVer,
  bump: 'major' | 'minor' | 'patch'
): SemVer {
  switch (bump) {
    case 'major':
      return { major: current.major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major: current.major, minor: current.minor + 1, patch: 0 };
    case 'patch':
      return {
        major: current.major,
        minor: current.minor,
        patch: current.patch + 1,
      };
  }
}

// ============================================================================
// Channel (pre-release)
// ============================================================================

export function applyChannel(
  version: SemVer,
  channel: string,
  prereleaseNumber: number
): SemVer {
  return {
    ...version,
    prerelease: `${channel}.${prereleaseNumber}`,
  };
}

// ============================================================================
// Version Sources
// ============================================================================

export function readVersionFromPackageJson(path: string): string {
  const content = fs.readFileSync(path, 'utf-8');
  const pkg = JSON.parse(content) as { version?: string };

  if (!pkg.version) {
    throw new Error(`No "version" field found in ${path}`);
  }

  if (!isValidSemVer(pkg.version)) {
    throw new Error(
      `Invalid version "${pkg.version}" in ${path}. Must be valid semver.`
    );
  }

  return pkg.version;
}

export function readVersionFromFile(
  filePath: string,
  pattern: string
): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  const regex = new RegExp(pattern);
  const match = content.match(regex);

  if (!match || !match[1]) {
    throw new Error(
      `Could not extract version from ${filePath} using pattern: ${pattern}`
    );
  }

  const version = match[1];
  if (!isValidSemVer(version)) {
    throw new Error(
      `Extracted version "${version}" from ${filePath} is not valid semver.`
    );
  }

  return version;
}

// ============================================================================
// Compare
// ============================================================================

export function compareSemVer(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}
