import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendNotifications } from '../notifications'
import { buildTemplateVariables } from '../template'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.mock('@actions/core', () => ({
	info: vi.fn(),
	warning: vi.fn(),
}))

const variables = buildTemplateVariables({
	actor: 'octocat',
	changelog: '- feat: new thing',
	changes: '- feat: new thing',
	compare_url: 'https://github.com/owner/repo/compare/v0.9.0...v1.0.0',
	release_url: 'https://github.com/owner/repo/releases/tag/v1.0.0',
	repo: 'owner/repo',
	tag: 'v1.0.0',
	version: '1.0.0',
})

beforeEach(() => {
	vi.clearAllMocks()
	mockFetch.mockResolvedValue({ ok: true, text: async () => '' })
})

describe('sendNotifications', () => {
	it('sends Slack notification', async () => {
		await sendNotifications({ slackWebhook: 'https://hooks.slack.com/test' }, variables)

		expect(mockFetch).toHaveBeenCalledTimes(1)
		expect(mockFetch).toHaveBeenCalledWith(
			'https://hooks.slack.com/test',
			expect.objectContaining({ method: 'POST' }),
		)

		const body = JSON.parse(mockFetch.mock.calls[0][1].body)
		expect(body.text).toContain('owner/repo')
		expect(body.text).toContain('v1.0.0')
		expect(body.blocks).toBeDefined()
	})

	it('sends Discord notification', async () => {
		await sendNotifications({ discordWebhook: 'https://discord.com/api/webhooks/test' }, variables)

		expect(mockFetch).toHaveBeenCalledTimes(1)
		const body = JSON.parse(mockFetch.mock.calls[0][1].body)
		expect(body.embeds).toBeDefined()
		expect(body.embeds[0].title).toContain('owner/repo')
	})

	it('sends Teams notification', async () => {
		await sendNotifications({ teamsWebhook: 'https://teams.webhook.test' }, variables)

		expect(mockFetch).toHaveBeenCalledTimes(1)
		const body = JSON.parse(mockFetch.mock.calls[0][1].body)
		expect(body['@type']).toBe('MessageCard')
		expect(body.title).toContain('owner/repo')
	})

	it('sends generic webhook with full variables', async () => {
		await sendNotifications({ genericWebhookUrl: 'https://webhook.example.com/release' }, variables)

		expect(mockFetch).toHaveBeenCalledTimes(1)
		const body = JSON.parse(mockFetch.mock.calls[0][1].body)
		expect(body.tag).toBe('v1.0.0')
		expect(body.repo).toBe('owner/repo')
	})

	it('sends to all providers in parallel', async () => {
		await sendNotifications(
			{
				discordWebhook: 'https://discord.test',
				genericWebhookUrl: 'https://generic.test',
				slackWebhook: 'https://slack.test',
				teamsWebhook: 'https://teams.test',
			},
			variables,
		)

		expect(mockFetch).toHaveBeenCalledTimes(4)
	})

	it('uses custom notification template', async () => {
		await sendNotifications(
			{
				slackWebhook: 'https://slack.test',
				template: 'Released {{tag}} for {{repo}}',
			},
			variables,
		)

		const body = JSON.parse(mockFetch.mock.calls[0][1].body)
		expect(body.text).toBe('Released v1.0.0 for owner/repo')
	})

	it('does not throw on webhook failure', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			text: async () => 'Server error',
		})

		await expect(sendNotifications({ slackWebhook: 'https://slack.test' }, variables)).resolves.not.toThrow()
	})

	it('does nothing when no webhooks configured', async () => {
		await sendNotifications({}, variables)
		expect(mockFetch).not.toHaveBeenCalled()
	})
})
