import * as core from '@actions/core'
import type { NotificationConfig, TemplateVariables } from './types'
import { renderTemplate } from './template'

const DEFAULT_NOTIFICATION_TEMPLATE = '🚀 *{{repo}}* {{tag}} released! {{release_url}}'

export async function sendNotifications(config: NotificationConfig, variables: TemplateVariables): Promise<void> {
	const template = config.template ?? DEFAULT_NOTIFICATION_TEMPLATE
	const message = renderTemplate(template, variables)

	const tasks: Promise<void>[] = []

	if (config.slackWebhook) {
		tasks.push(sendSlack(config.slackWebhook, message, variables))
	}

	if (config.discordWebhook) {
		tasks.push(sendDiscord(config.discordWebhook, message, variables))
	}

	if (config.teamsWebhook) {
		tasks.push(sendTeams(config.teamsWebhook, message, variables))
	}

	if (config.genericWebhookUrl) {
		tasks.push(sendGenericWebhook(config.genericWebhookUrl, variables))
	}

	const results = await Promise.allSettled(tasks)
	for (const result of results) {
		if (result.status === 'rejected') {
			core.warning(`Notification failed: ${result.reason}`)
		}
	}
}

async function postWebhook(url: string, payload: unknown, provider: string): Promise<void> {
	const response = await fetch(url, {
		body: JSON.stringify(payload),
		headers: { 'Content-Type': 'application/json' },
		method: 'POST',
	})

	if (!response.ok) {
		throw new Error(`${provider} webhook failed (${response.status}): ${await response.text()}`)
	}

	core.info(`${provider} notification sent`)
}

async function sendDiscord(webhookUrl: string, message: string, variables: TemplateVariables): Promise<void> {
	const payload = {
		content: message,
		embeds: [
			{
				color: 3447003,
				description: variables.changelog || variables.changes || undefined,
				footer: {
					text: `Released by ${variables.actor}`,
				},
				timestamp: new Date().toISOString(),
				title: `${variables.repo} ${variables.tag}`,
				url: variables.release_url,
			},
		],
	}

	await postWebhook(webhookUrl, payload, 'Discord')
}

async function sendGenericWebhook(url: string, variables: TemplateVariables): Promise<void> {
	await postWebhook(url, variables, 'Generic webhook')
}

async function sendSlack(webhookUrl: string, message: string, variables: TemplateVariables): Promise<void> {
	const payload = {
		blocks: [
			{
				text: {
					text: message,
					type: 'mrkdwn',
				},
				type: 'section',
			},
			{
				elements: [
					{
						text: `<${variables.compare_url}|View changes> | <${variables.release_url}|Release page>`,
						type: 'mrkdwn',
					},
				],
				type: 'context',
			},
		],
		text: message,
	}

	await postWebhook(webhookUrl, payload, 'Slack')
}

async function sendTeams(webhookUrl: string, message: string, variables: TemplateVariables): Promise<void> {
	const payload = {
		'@context': 'http://schema.org/extensions',
		'@type': 'MessageCard',
		potentialAction: [
			{
				'@type': 'OpenUri',
				name: 'View Release',
				targets: [{ os: 'default', uri: variables.release_url }],
			},
			{
				'@type': 'OpenUri',
				name: 'View Changes',
				targets: [{ os: 'default', uri: variables.compare_url }],
			},
		],
		sections: [
			{
				text: message,
			},
		],
		summary: `${variables.repo} ${variables.tag} released`,
		themeColor: '0076D7',
		title: `${variables.repo} ${variables.tag}`,
	}

	await postWebhook(webhookUrl, payload, 'Teams')
}
