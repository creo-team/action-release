import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LlmInput, LlmOptions } from '../llm'
import { generateLlmReleaseNotes } from '../llm'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('@actions/core', () => ({
	info: vi.fn(),
	warning: vi.fn(),
}))

const baseOptions: LlmOptions = {
	apiKey: 'test-key',
	maxTokens: 512,
	provider: 'openai',
}

const baseInput: LlmInput = {
	commitMessages: ['feat: add login', 'fix: resolve crash'],
	newTag: 'v1.1.0',
	previousTag: 'v1.0.0',
	repo: 'owner/repo',
}

beforeEach(() => {
	vi.clearAllMocks()
})

describe('generateLlmReleaseNotes', () => {
	describe('OpenAI', () => {
		it('calls OpenAI endpoint with correct payload', async () => {
			mockFetch.mockResolvedValueOnce({
				json: async () => ({
					choices: [{ message: { content: 'Generated notes' } }],
				}),
				ok: true,
			})

			const result = await generateLlmReleaseNotes(baseOptions, baseInput)

			expect(result).toBe('Generated notes')
			expect(mockFetch).toHaveBeenCalledWith(
				'https://api.openai.com/v1/chat/completions',
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer test-key',
					}),
					method: 'POST',
				}),
			)

			const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
			expect(body.model).toBe('gpt-4o-mini')
			expect(body.messages).toHaveLength(2)
			expect(body.messages[0].role).toBe('system')
			expect(body.messages[1].role).toBe('user')
			expect(body.messages[1].content).toContain('feat: add login')
		})
	})

	describe('Anthropic', () => {
		it('calls Anthropic endpoint with correct headers', async () => {
			mockFetch.mockResolvedValueOnce({
				json: async () => ({
					content: [{ text: 'Anthropic notes', type: 'text' }],
				}),
				ok: true,
			})

			const result = await generateLlmReleaseNotes({ ...baseOptions, provider: 'anthropic' }, baseInput)

			expect(result).toBe('Anthropic notes')
			expect(mockFetch).toHaveBeenCalledWith(
				'https://api.anthropic.com/v1/messages',
				expect.objectContaining({
					headers: expect.objectContaining({
						'anthropic-version': '2023-06-01',
						'x-api-key': 'test-key',
					}),
				}),
			)
		})
	})

	describe('OpenRouter', () => {
		it('includes OpenRouter-specific headers', async () => {
			mockFetch.mockResolvedValueOnce({
				json: async () => ({
					choices: [{ message: { content: 'Router notes' } }],
				}),
				ok: true,
			})

			await generateLlmReleaseNotes({ ...baseOptions, provider: 'openrouter' }, baseInput)

			expect(mockFetch).toHaveBeenCalledWith(
				'https://openrouter.ai/api/v1/chat/completions',
				expect.objectContaining({
					headers: expect.objectContaining({
						'HTTP-Referer': 'https://github.com/creo-team/action-release',
						'X-Title': 'action-release',
					}),
				}),
			)
		})
	})

	describe('error handling', () => {
		it('returns empty string on API error', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: async () => 'Internal Server Error',
			})

			const result = await generateLlmReleaseNotes(baseOptions, baseInput)
			expect(result).toBe('')
		})

		it('returns empty string on network error', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Network error'))

			const result = await generateLlmReleaseNotes(baseOptions, baseInput)
			expect(result).toBe('')
		})

		it('returns empty string when response has no content', async () => {
			mockFetch.mockResolvedValueOnce({
				json: async () => ({ choices: [] }),
				ok: true,
			})

			const result = await generateLlmReleaseNotes(baseOptions, baseInput)
			expect(result).toBe('')
		})
	})

	describe('custom options', () => {
		it('uses custom model', async () => {
			mockFetch.mockResolvedValueOnce({
				json: async () => ({
					choices: [{ message: { content: 'notes' } }],
				}),
				ok: true,
			})

			await generateLlmReleaseNotes({ ...baseOptions, model: 'gpt-4o' }, baseInput)

			const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
			expect(body.model).toBe('gpt-4o')
		})

		it('uses custom system prompt', async () => {
			mockFetch.mockResolvedValueOnce({
				json: async () => ({
					choices: [{ message: { content: 'notes' } }],
				}),
				ok: true,
			})

			await generateLlmReleaseNotes({ ...baseOptions, systemPrompt: 'Be brief.' }, baseInput)

			const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
			expect(body.messages[0].content).toBe('Be brief.')
		})

		it('includes diff when provided', async () => {
			mockFetch.mockResolvedValueOnce({
				json: async () => ({
					choices: [{ message: { content: 'notes' } }],
				}),
				ok: true,
			})

			await generateLlmReleaseNotes(baseOptions, {
				...baseInput,
				diff: '+ added line\n- removed line',
			})

			const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
			expect(body.messages[1].content).toContain('Diff')
			expect(body.messages[1].content).toContain('added line')
		})
	})
})
