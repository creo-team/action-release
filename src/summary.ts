import * as core from '@actions/core';
import { TemplateVariables } from './types';

// ============================================================================
// GitHub Step Summary
// ============================================================================

export async function writeStepSummary(
  variables: TemplateVariables,
  options: {
    dryRun: boolean;
    created: boolean;
    tags: string[];
    changelog?: string;
    llmSummary?: string;
    codename?: string;
    uploadedAssets?: string[];
  }
): Promise<void> {
  const summary = core.summary;

  if (options.dryRun) {
    summary.addHeading('🔍 Release Dry Run', 2);
    summary.addRaw(
      '> No tags, releases, or commits were created. This is a preview.\n\n'
    );
  } else if (options.created) {
    summary.addHeading('🚀 Release Created', 2);
  } else {
    summary.addHeading('⏭️ Release Skipped', 2);
    summary.addRaw('> The release already exists.\n\n');
  }

  summary.addTable([
    [
      { data: 'Property', header: true },
      { data: 'Value', header: true },
    ],
    ['Tag', `\`${variables.tag}\``],
    ['Version', `\`${variables.version}\``],
    [
      'Previous Tag',
      variables.previous_tag ? `\`${variables.previous_tag}\`` : '(none)',
    ],
    ['Date', variables.date],
    ['Branch', `\`${variables.branch}\``],
    ['Actor', `@${variables.actor}`],
  ]);

  if (options.tags.length > 1) {
    summary.addHeading('Tags', 3);
    summary.addList(options.tags.map((t) => `\`${t}\``));
  }

  if (options.codename) {
    summary.addHeading('Codename', 3);
    summary.addRaw(`**${options.codename}**\n\n`);
  }

  if (variables.compare_url) {
    summary.addLink('Compare changes', variables.compare_url);
    summary.addRaw('\n\n');
  }

  if (variables.release_url && !options.dryRun) {
    summary.addLink('View release', variables.release_url);
    summary.addRaw('\n\n');
  }

  if (options.changelog) {
    summary.addHeading('Changelog', 3);
    summary.addRaw(options.changelog);
    summary.addRaw('\n\n');
  }

  if (options.llmSummary) {
    summary.addHeading('AI Summary', 3);
    summary.addRaw(options.llmSummary);
    summary.addRaw('\n\n');
  }

  if (options.uploadedAssets && options.uploadedAssets.length > 0) {
    summary.addHeading('Assets', 3);
    summary.addList(options.uploadedAssets);
  }

  await summary.write();
}
