import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateLlmReleaseNotes, LlmOptions, LlmInput } from '../llm';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('@actions/core', () => ({
  info: vi.fn(),
  warning: vi.fn(),
}));

const baseOptions: LlmOptions = {
  provider: 'openai',
  apiKey: 'test-key',
  maxTokens: 512,
};

const baseInput: LlmInput = {
  commitMessages: ['feat: add login', 'fix: resolve crash'],
  previousTag: 'v1.0.0',
  newTag: 'v1.1.0',
  repo: 'owner/repo',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateLlmReleaseNotes', () => {
  describe('OpenAI', () => {
    it('calls OpenAI endpoint with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Generated notes' } }],
        }),
      });

      const result = await generateLlmReleaseNotes(baseOptions, baseInput);

      expect(result).toBe('Generated notes');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
      expect(body.messages[1].content).toContain('feat: add login');
    });
  });

  describe('Anthropic', () => {
    it('calls Anthropic endpoint with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'Anthropic notes' }],
        }),
      });

      const result = await generateLlmReleaseNotes(
        { ...baseOptions, provider: 'anthropic' },
        baseInput
      );

      expect(result).toBe('Anthropic notes');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'test-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });
  });

  describe('OpenRouter', () => {
    it('includes OpenRouter-specific headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Router notes' } }],
        }),
      });

      await generateLlmReleaseNotes(
        { ...baseOptions, provider: 'openrouter' },
        baseInput
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          headers: expect.objectContaining({
            'HTTP-Referer': 'https://github.com/creo-team/action-release',
            'X-Title': 'action-release',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('returns empty string on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const result = await generateLlmReleaseNotes(baseOptions, baseInput);
      expect(result).toBe('');
    });

    it('returns empty string on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await generateLlmReleaseNotes(baseOptions, baseInput);
      expect(result).toBe('');
    });

    it('returns empty string when response has no content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] }),
      });

      const result = await generateLlmReleaseNotes(baseOptions, baseInput);
      expect(result).toBe('');
    });
  });

  describe('custom options', () => {
    it('uses custom model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'notes' } }],
        }),
      });

      await generateLlmReleaseNotes(
        { ...baseOptions, model: 'gpt-4o' },
        baseInput
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('gpt-4o');
    });

    it('uses custom system prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'notes' } }],
        }),
      });

      await generateLlmReleaseNotes(
        { ...baseOptions, systemPrompt: 'Be brief.' },
        baseInput
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages[0].content).toBe('Be brief.');
    });

    it('includes diff when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'notes' } }],
        }),
      });

      await generateLlmReleaseNotes(baseOptions, {
        ...baseInput,
        diff: '+ added line\n- removed line',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages[1].content).toContain('Diff');
      expect(body.messages[1].content).toContain('added line');
    });
  });
});
