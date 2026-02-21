import * as core from '@actions/core';
import {
  LlmProvider,
  LLM_DEFAULT_MODELS,
  LLM_ENDPOINTS,
  DEFAULT_LLM_PROMPT,
} from './types';

// ============================================================================
// LLM Release Notes Generation
// ============================================================================

export interface LlmOptions {
  provider: LlmProvider;
  apiKey: string;
  model?: string;
  systemPrompt?: string;
  maxTokens: number;
}

export interface LlmInput {
  commitMessages: string[];
  diff?: string;
  previousTag: string;
  newTag: string;
  repo: string;
}

// ============================================================================
// Main Entry Point
// ============================================================================

export async function generateLlmReleaseNotes(
  options: LlmOptions,
  input: LlmInput
): Promise<string> {
  const model = options.model ?? LLM_DEFAULT_MODELS[options.provider];
  const systemPrompt = options.systemPrompt ?? DEFAULT_LLM_PROMPT;
  const userPrompt = buildUserPrompt(input);

  core.info(`Generating LLM release notes with ${options.provider} (${model})`);

  try {
    switch (options.provider) {
      case 'openai':
      case 'openrouter':
        return await callOpenAICompatible(
          LLM_ENDPOINTS[options.provider],
          options.apiKey,
          model,
          systemPrompt,
          userPrompt,
          options.maxTokens,
          options.provider
        );
      case 'anthropic':
        return await callAnthropic(
          options.apiKey,
          model,
          systemPrompt,
          userPrompt,
          options.maxTokens
        );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    core.warning(`LLM release notes generation failed: ${message}`);
    return '';
  }
}

// ============================================================================
// Prompt Construction
// ============================================================================

function buildUserPrompt(input: LlmInput): string {
  const parts: string[] = [
    `Repository: ${input.repo}`,
    `Release: ${input.previousTag || '(initial)'} → ${input.newTag}`,
    '',
    '## Commits',
    '',
  ];

  if (input.commitMessages.length === 0) {
    parts.push('(no commits)');
  } else {
    for (const msg of input.commitMessages) {
      parts.push(`- ${msg.split('\n')[0]}`);
    }
  }

  if (input.diff) {
    const truncatedDiff = truncateDiff(input.diff);
    parts.push('', '## Diff', '', '```', truncatedDiff, '```');
  }

  return parts.join('\n');
}

const MAX_DIFF_CHARS = 12000;

function truncateDiff(diff: string): string {
  if (diff.length <= MAX_DIFF_CHARS) return diff;

  return (
    diff.substring(0, MAX_DIFF_CHARS) +
    '\n\n... (diff truncated for token limits)'
  );
}

// ============================================================================
// OpenAI-Compatible API (OpenAI + OpenRouter)
// ============================================================================

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  provider: LlmProvider
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://github.com/creo-team/action-release';
    headers['X-Title'] = 'action-release';
  }

  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.3,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `${provider} API error (${response.status}): ${text}`
    );
  }

  const data = (await response.json()) as OpenAIResponse;

  if (data.error?.message) {
    throw new Error(`${provider} API error: ${data.error.message}`);
  }

  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

// ============================================================================
// Anthropic API
// ============================================================================

interface AnthropicResponse {
  content?: Array<{
    type: string;
    text?: string;
  }>;
  error?: {
    message?: string;
  };
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const body = JSON.stringify({
    model,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    max_tokens: maxTokens,
    temperature: 0.3,
  });

  const response = await fetch(LLM_ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as AnthropicResponse;

  if (data.error?.message) {
    throw new Error(`Anthropic API error: ${data.error.message}`);
  }

  const textBlock = data.content?.find((c) => c.type === 'text');
  return textBlock?.text?.trim() ?? '';
}
