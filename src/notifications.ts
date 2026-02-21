import * as core from '@actions/core';
import { NotificationConfig, TemplateVariables } from './types';
import { renderTemplate } from './template';

// ============================================================================
// Notification Dispatcher
// ============================================================================

const DEFAULT_NOTIFICATION_TEMPLATE =
  '🚀 *{{repo}}* {{tag}} released! {{release_url}}';

export async function sendNotifications(
  config: NotificationConfig,
  variables: TemplateVariables
): Promise<void> {
  const template = config.template ?? DEFAULT_NOTIFICATION_TEMPLATE;
  const message = renderTemplate(template, variables);

  const tasks: Promise<void>[] = [];

  if (config.slackWebhook) {
    tasks.push(sendSlack(config.slackWebhook, message, variables));
  }

  if (config.discordWebhook) {
    tasks.push(sendDiscord(config.discordWebhook, message, variables));
  }

  if (config.teamsWebhook) {
    tasks.push(sendTeams(config.teamsWebhook, message, variables));
  }

  if (config.genericWebhookUrl) {
    tasks.push(sendGenericWebhook(config.genericWebhookUrl, variables));
  }

  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === 'rejected') {
      core.warning(`Notification failed: ${result.reason}`);
    }
  }
}

// ============================================================================
// Slack
// ============================================================================

async function sendSlack(
  webhookUrl: string,
  message: string,
  variables: TemplateVariables
): Promise<void> {
  const payload = {
    text: message,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${variables.compare_url}|View changes> | <${variables.release_url}|Release page>`,
          },
        ],
      },
    ],
  };

  await postWebhook(webhookUrl, payload, 'Slack');
}

// ============================================================================
// Discord
// ============================================================================

async function sendDiscord(
  webhookUrl: string,
  message: string,
  variables: TemplateVariables
): Promise<void> {
  const payload = {
    content: message,
    embeds: [
      {
        title: `${variables.repo} ${variables.tag}`,
        url: variables.release_url,
        description: variables.changelog || variables.changes || undefined,
        color: 3447003,
        footer: {
          text: `Released by ${variables.actor}`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  await postWebhook(webhookUrl, payload, 'Discord');
}

// ============================================================================
// Microsoft Teams
// ============================================================================

async function sendTeams(
  webhookUrl: string,
  message: string,
  variables: TemplateVariables
): Promise<void> {
  const payload = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    summary: `${variables.repo} ${variables.tag} released`,
    themeColor: '0076D7',
    title: `${variables.repo} ${variables.tag}`,
    sections: [
      {
        text: message,
      },
    ],
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
  };

  await postWebhook(webhookUrl, payload, 'Teams');
}

// ============================================================================
// Generic Webhook
// ============================================================================

async function sendGenericWebhook(
  url: string,
  variables: TemplateVariables
): Promise<void> {
  await postWebhook(url, variables, 'Generic webhook');
}

// ============================================================================
// HTTP Post
// ============================================================================

async function postWebhook(
  url: string,
  payload: unknown,
  provider: string
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `${provider} webhook failed (${response.status}): ${await response.text()}`
    );
  }

  core.info(`${provider} notification sent`);
}
