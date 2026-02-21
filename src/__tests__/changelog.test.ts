import { describe, it, expect } from 'vitest';
import {
  parseCommitMessage,
  generateChangelog,
  formatRawChanges,
} from '../changelog';

describe('parseCommitMessage', () => {
  it('parses feat commit', () => {
    const result = parseCommitMessage('feat: add login');
    expect(result).toEqual({
      type: 'feat',
      scope: undefined,
      description: 'add login',
      breaking: false,
    });
  });

  it('parses scoped commit', () => {
    const result = parseCommitMessage('fix(auth): resolve token issue');
    expect(result).toEqual({
      type: 'fix',
      scope: 'auth',
      description: 'resolve token issue',
      breaking: false,
    });
  });

  it('parses breaking change bang', () => {
    const result = parseCommitMessage('feat!: remove old API');
    expect(result).toEqual({
      type: 'feat',
      scope: undefined,
      description: 'remove old API',
      breaking: true,
    });
  });

  it('parses BREAKING CHANGE footer', () => {
    const result = parseCommitMessage(
      'refactor: rewrite\n\nBREAKING CHANGE: dropped support'
    );
    expect(result?.breaking).toBe(true);
  });

  it('returns null for non-conventional commits', () => {
    expect(parseCommitMessage('updated the readme')).toBeNull();
    expect(parseCommitMessage('')).toBeNull();
  });
});

describe('generateChangelog', () => {
  it('generates grouped changelog', () => {
    const messages = [
      'feat: add button',
      'fix: resolve crash',
      'docs: update readme',
      'feat!: remove deprecated API',
    ];
    const hashes = ['aaa1111', 'bbb2222', 'ccc3333', 'ddd4444'];

    const result = generateChangelog(messages, hashes);

    expect(result).toContain('Breaking Changes');
    expect(result).toContain('Features');
    expect(result).toContain('Bug Fixes');
    expect(result).toContain('Documentation');
    expect(result).toContain('remove deprecated API');
    expect(result).toContain('add button');
    expect(result).toContain('resolve crash');
    expect(result).toContain('aaa1111');
  });

  it('returns empty string for no conventional commits', () => {
    const result = generateChangelog(['random message', 'another one']);
    expect(result).toBe('');
  });

  it('handles empty input', () => {
    expect(generateChangelog([])).toBe('');
  });

  it('works without hashes', () => {
    const result = generateChangelog(['feat: something']);
    expect(result).toContain('something');
    expect(result).not.toContain('(undefined)');
  });

  it('groups scoped commits correctly', () => {
    const result = generateChangelog([
      'feat(ui): add modal',
      'feat(api): add endpoint',
    ]);
    expect(result).toContain('**ui:**');
    expect(result).toContain('**api:**');
  });
});

describe('formatRawChanges', () => {
  it('formats commit messages as bullet list', () => {
    const result = formatRawChanges(
      ['first commit', 'second commit'],
      ['aaa1111', 'bbb2222']
    );
    expect(result).toBe('- first commit (aaa1111)\n- second commit (bbb2222)');
  });

  it('handles messages without hashes', () => {
    const result = formatRawChanges(['first commit']);
    expect(result).toBe('- first commit');
  });

  it('uses only first line of multiline commits', () => {
    const result = formatRawChanges(['first line\nsecond line']);
    expect(result).toBe('- first line');
  });
});
