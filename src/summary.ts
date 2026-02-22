import * as core from '@actions/core'
import type { TemplateVariables } from './types'

interface MarketplaceHint {
	editUrl: string
}

interface SummaryOptions {
	changelog?: string
	codename?: string
	created: boolean
	dryRun: boolean
	llmSummary?: string
	marketplace?: MarketplaceHint
	tags: string[]
	uploadedAssets?: string[]
}

export async function writeStepSummary(variables: TemplateVariables, options: SummaryOptions): Promise<void> {
	const markdown = buildSummaryMarkdown(variables, options)
	await core.summary.addRaw(markdown).write()
}

export function buildSummaryMarkdown(variables: TemplateVariables, options: SummaryOptions): string {
	const lines: string[] = []

	const title = options.codename ? `${variables.version} "${options.codename}"` : variables.version
	const status = options.dryRun ? 'Dry Run' : options.created ? 'Released' : 'Skipped'

	lines.push(`# ${title}`)
	lines.push('')

	if (options.dryRun) {
		lines.push('> **Dry run** — no tags, releases, or commits were created.')
		lines.push('')
	} else if (!options.created) {
		lines.push('> **Skipped** — this release already exists.')
		lines.push('')
	}

	lines.push(`${status} from \`${variables.branch}\` by @${variables.actor} on ${variables.date}`)
	lines.push('')

	const details = [`**Tag** \`${variables.tag}\``]
	if (variables.previous_tag) {
		details.push(`**Previous** \`${variables.previous_tag}\``)
	}
	if (options.tags.length > 1) {
		details.push(`**All tags** ${options.tags.map((t) => `\`${t}\``).join(' ')}`)
	}
	lines.push(details.join(' · '))
	lines.push('')

	const links: string[] = []
	if (variables.compare_url) links.push(`[Compare changes](${variables.compare_url})`)
	if (variables.release_url && !options.dryRun) links.push(`[View release](${variables.release_url})`)
	if (links.length > 0) {
		lines.push(links.join(' · '))
		lines.push('')
	}

	if (options.llmSummary) {
		lines.push('---')
		lines.push('')
		lines.push(options.llmSummary)
		lines.push('')
	}

	if (options.changelog) {
		lines.push('---')
		lines.push('')
		lines.push(options.changelog)
		lines.push('')
	}

	if (options.uploadedAssets && options.uploadedAssets.length > 0) {
		lines.push('---')
		lines.push('')
		lines.push('### Assets')
		lines.push('')
		for (const asset of options.uploadedAssets) {
			lines.push(`- ${asset}`)
		}
		lines.push('')
	}

	if (options.marketplace && options.created && !options.dryRun) {
		const { editUrl } = options.marketplace
		lines.push('---')
		lines.push('')
		lines.push('### Publish to GitHub Marketplace')
		lines.push('')
		lines.push(`[Edit this release](${editUrl}) → check **Publish this Action to the GitHub Marketplace** → select categories → Update release.`)
		lines.push('')
		lines.push(
			'> Org owner must [accept the Marketplace Developer Agreement](https://docs.github.com/en/apps/github-marketplace/listing-an-app-on-github-marketplace/submitting-your-listing-for-publication) first.',
		)
		lines.push('')
	}

	return lines.join('\n')
}
