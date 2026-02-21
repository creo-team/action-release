import { describe, it, expect } from 'vitest';
import {
  parseSemVer,
  formatSemVer,
  isValidSemVer,
  bumpVersion,
  applyChannel,
  compareSemVer,
} from '../version';

describe('parseSemVer', () => {
  it('parses basic semver', () => {
    expect(parseSemVer('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('parses with v prefix', () => {
    expect(parseSemVer('v1.2.3')).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it('parses with prerelease', () => {
    expect(parseSemVer('1.0.0-beta.1')).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: 'beta.1',
    });
  });

  it('parses with v prefix and prerelease', () => {
    expect(parseSemVer('v2.1.0-alpha.3')).toEqual({
      major: 2,
      minor: 1,
      patch: 0,
      prerelease: 'alpha.3',
    });
  });

  it('returns null for invalid input', () => {
    expect(parseSemVer('not-a-version')).toBeNull();
    expect(parseSemVer('')).toBeNull();
    expect(parseSemVer('1.2')).toBeNull();
    expect(parseSemVer('abc')).toBeNull();
  });

  it('handles zero versions', () => {
    expect(parseSemVer('0.0.0')).toEqual({ major: 0, minor: 0, patch: 0 });
    expect(parseSemVer('0.1.0')).toEqual({ major: 0, minor: 1, patch: 0 });
  });
});

describe('formatSemVer', () => {
  it('formats basic version', () => {
    expect(formatSemVer({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3');
  });

  it('formats with prerelease', () => {
    expect(
      formatSemVer({ major: 1, minor: 0, patch: 0, prerelease: 'beta.1' })
    ).toBe('1.0.0-beta.1');
  });
});

describe('isValidSemVer', () => {
  it('returns true for valid versions', () => {
    expect(isValidSemVer('1.0.0')).toBe(true);
    expect(isValidSemVer('v1.0.0')).toBe(true);
    expect(isValidSemVer('0.1.0-alpha.1')).toBe(true);
  });

  it('returns false for invalid versions', () => {
    expect(isValidSemVer('nope')).toBe(false);
    expect(isValidSemVer('1.2')).toBe(false);
  });
});

describe('bumpVersion', () => {
  const base = { major: 1, minor: 2, patch: 3 };

  it('bumps patch', () => {
    expect(bumpVersion(base, 'patch')).toEqual({ major: 1, minor: 2, patch: 4 });
  });

  it('bumps minor and resets patch', () => {
    expect(bumpVersion(base, 'minor')).toEqual({ major: 1, minor: 3, patch: 0 });
  });

  it('bumps major and resets minor and patch', () => {
    expect(bumpVersion(base, 'major')).toEqual({ major: 2, minor: 0, patch: 0 });
  });

  it('bumps from zero', () => {
    const zero = { major: 0, minor: 0, patch: 0 };
    expect(bumpVersion(zero, 'patch')).toEqual({ major: 0, minor: 0, patch: 1 });
    expect(bumpVersion(zero, 'minor')).toEqual({ major: 0, minor: 1, patch: 0 });
    expect(bumpVersion(zero, 'major')).toEqual({ major: 1, minor: 0, patch: 0 });
  });
});

describe('applyChannel', () => {
  it('adds channel prerelease', () => {
    const version = { major: 1, minor: 2, patch: 0 };
    expect(applyChannel(version, 'beta', 3)).toEqual({
      major: 1,
      minor: 2,
      patch: 0,
      prerelease: 'beta.3',
    });
  });

  it('handles alpha channel', () => {
    const version = { major: 2, minor: 0, patch: 0 };
    expect(applyChannel(version, 'alpha', 1)).toEqual({
      major: 2,
      minor: 0,
      patch: 0,
      prerelease: 'alpha.1',
    });
  });
});

describe('compareSemVer', () => {
  it('compares major versions', () => {
    const a = { major: 2, minor: 0, patch: 0 };
    const b = { major: 1, minor: 9, patch: 9 };
    expect(compareSemVer(a, b)).toBeGreaterThan(0);
    expect(compareSemVer(b, a)).toBeLessThan(0);
  });

  it('compares minor versions', () => {
    const a = { major: 1, minor: 3, patch: 0 };
    const b = { major: 1, minor: 2, patch: 9 };
    expect(compareSemVer(a, b)).toBeGreaterThan(0);
  });

  it('compares patch versions', () => {
    const a = { major: 1, minor: 2, patch: 4 };
    const b = { major: 1, minor: 2, patch: 3 };
    expect(compareSemVer(a, b)).toBeGreaterThan(0);
  });

  it('returns 0 for equal versions', () => {
    const a = { major: 1, minor: 2, patch: 3 };
    const b = { major: 1, minor: 2, patch: 3 };
    expect(compareSemVer(a, b)).toBe(0);
  });
});
