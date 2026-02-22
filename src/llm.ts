import * as core from '@actions/core'
import type { LlmProvider } from './types'
import { DEFAULT_LLM_PROMPT, LLM_DEFAULT_MODELS, LLM_ENDPOINTS } from './types'

export interface LlmInput {
	commitMessages: string[]
	diff?: string
	newTag: string
	previousTag: string
	repo: string
}

export interface LlmOptions {
	apiKey: string
	maxTokens: number
	model?: string
	provider: LlmProvider
	systemPrompt?: string
}

export async function generateLlmReleaseNotes(options: LlmOptions, input: LlmInput): Promise<string> {
	const model = options.model ?? LLM_DEFAULT_MODELS[options.provider]
	const systemPrompt = options.systemPrompt ?? DEFAULT_LLM_PROMPT
	const userPrompt = buildUserPrompt(input)

	core.info(`Generating LLM release notes with ${options.provider} (${model})`)

	try {
		switch (options.provider) {
			case 'anthropic':
				return await callAnthropic(options.apiKey, model, systemPrompt, userPrompt, options.maxTokens)
			case 'openai':
			case 'openrouter':
				return await callOpenAICompatible(
					LLM_ENDPOINTS[options.provider],
					options.apiKey,
					model,
					systemPrompt,
					userPrompt,
					options.maxTokens,
					options.provider,
				)
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		core.warning(`LLM release notes generation failed: ${message}`)

		return ''
	}
}

function buildUserPrompt(input: LlmInput): string {
	const parts: string[] = [
		`Repository: ${input.repo}`,
		`Release: ${input.previousTag || '(initial)'} → ${input.newTag}`,
		'',
		'## Commits',
		'',
	]

	if (input.commitMessages.length === 0) {
		parts.push('(no commits)')
	} else {
		for (const msg of input.commitMessages) {
			parts.push(`- ${msg.split('\n')[0]}`)
		}
	}

	if (input.diff) {
		const truncatedDiff = truncateDiff(input.diff)
		parts.push('', '## Diff', '', '```', truncatedDiff, '```')
	}

	return parts.join('\n')
}

const MAX_DIFF_CHARS = 12000

interface AnthropicResponse {
	content?: {
		text?: string
		type: string
	}[]
	error?: {
		message?: string
	}
}

interface OpenAIResponse {
	choices?: {
		message?: {
			content?: string
		}
	}[]
	error?: {
		message?: string
	}
}

async function callAnthropic(
	apiKey: string,
	model: string,
	systemPrompt: string,
	userPrompt: string,
	maxTokens: number,
): Promise<string> {
	const body = JSON.stringify({
		max_tokens: maxTokens,
		messages: [{ content: userPrompt, role: 'user' }],
		model,
		system: systemPrompt,
		temperature: 0.3,
	})

	const response = await fetch(LLM_ENDPOINTS.anthropic, {
		body,
		headers: {
			'anthropic-version': '2023-06-01',
			'Content-Type': 'application/json',
			'x-api-key': apiKey,
		},
		method: 'POST',
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(`Anthropic API error (${response.status}): ${text}`)
	}

	const data = (await response.json()) as AnthropicResponse

	if (data.error?.message) {
		throw new Error(`Anthropic API error: ${data.error.message}`)
	}

	const textBlock = data.content?.find((c) => c.type === 'text')

	return textBlock?.text?.trim() ?? ''
}

async function callOpenAICompatible(
	endpoint: string,
	apiKey: string,
	model: string,
	systemPrompt: string,
	userPrompt: string,
	maxTokens: number,
	provider: LlmProvider,
): Promise<string> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${apiKey}`,
		'Content-Type': 'application/json',
	}

	if (provider === 'openrouter') {
		headers['HTTP-Referer'] = 'https://github.com/creo-team/action-release'
		headers['X-Title'] = 'action-release'
	}

	const body = JSON.stringify({
		max_tokens: maxTokens,
		messages: [
			{ content: systemPrompt, role: 'system' },
			{ content: userPrompt, role: 'user' },
		],
		model,
		temperature: 0.3,
	})

	const response = await fetch(endpoint, {
		body,
		headers,
		method: 'POST',
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(`${provider} API error (${response.status}): ${text}`)
	}

	const data = (await response.json()) as OpenAIResponse

	if (data.error?.message) {
		throw new Error(`${provider} API error: ${data.error.message}`)
	}

	return data.choices?.[0]?.message?.content?.trim() ?? ''
}

function truncateDiff(diff: string): string {
	if (diff.length <= MAX_DIFF_CHARS) return diff

	return diff.substring(0, MAX_DIFF_CHARS) + '\n\n... (diff truncated for token limits)'
}
