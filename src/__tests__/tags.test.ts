import { describe, it, expect } from 'vitest';
import {
  formatTag,
  formatMajorTag,
  formatMinorTag,
  getTagsForStrategy,
  stripPrefix,
  buildCompareUrl,
} from '../tags';
import { SemVer } from '../types';

const version: SemVer = { major: 1, minor: 2, patch: 3 };

describe('formatTag', () => {
  it('formats with v prefix', () => {
    expect(formatTag(version, 'v')).toBe('v1.2.3');
  });

  it('formats without prefix', () => {
    expect(formatTag(version, '')).toBe('1.2.3');
  });

  it('formats with custom prefix', () => {
    expect(formatTag(version, 'release-')).toBe('release-1.2.3');
  });

  it('formats with prerelease', () => {
    const pre: SemVer = { major: 1, minor: 0, patch: 0, prerelease: 'beta.2' };
    expect(formatTag(pre, 'v')).toBe('v1.0.0-beta.2');
  });
});

describe('formatMajorTag', () => {
  it('formats major tag', () => {
    expect(formatMajorTag(version, 'v')).toBe('v1');
  });

  it('formats without prefix', () => {
    expect(formatMajorTag(version, '')).toBe('1');
  });
});

describe('formatMinorTag', () => {
  it('formats minor tag', () => {
    expect(formatMinorTag(version, 'v')).toBe('v1.2');
  });

  it('formats without prefix', () => {
    expect(formatMinorTag(version, '')).toBe('1.2');
  });
});

describe('getTagsForStrategy', () => {
  it('returns only full tag for "full" strategy', () => {
    expect(getTagsForStrategy(version, 'v', 'full')).toEqual(['v1.2.3']);
  });

  it('returns all tags for "all" strategy', () => {
    expect(getTagsForStrategy(version, 'v', 'all')).toEqual([
      'v1.2.3',
      'v1.2',
      'v1',
    ]);
  });

  it('returns full and minor for "full-and-minor" strategy', () => {
    expect(getTagsForStrategy(version, 'v', 'full-and-minor')).toEqual([
      'v1.2.3',
      'v1.2',
    ]);
  });

  it('works with empty prefix', () => {
    expect(getTagsForStrategy(version, '', 'all')).toEqual([
      '1.2.3',
      '1.2',
      '1',
    ]);
  });

  it('handles prerelease with full strategy', () => {
    const pre: SemVer = { major: 1, minor: 0, patch: 0, prerelease: 'rc.1' };
    expect(getTagsForStrategy(pre, 'v', 'full')).toEqual(['v1.0.0-rc.1']);
  });
});

describe('stripPrefix', () => {
  it('strips v prefix', () => {
    expect(stripPrefix('v1.2.3', 'v')).toBe('1.2.3');
  });

  it('returns original when no prefix match', () => {
    expect(stripPrefix('1.2.3', 'v')).toBe('1.2.3');
  });

  it('strips custom prefix', () => {
    expect(stripPrefix('release-1.0.0', 'release-')).toBe('1.0.0');
  });
});

describe('buildCompareUrl', () => {
  it('builds correct compare URL', () => {
    expect(buildCompareUrl('owner', 'repo', 'v1.0.0', 'v1.1.0')).toBe(
      'https://github.com/owner/repo/compare/v1.0.0...v1.1.0'
    );
  });
});
