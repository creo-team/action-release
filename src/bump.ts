import type { BumpResult, BumpType } from './types'
import { BUMP_PRIORITY } from './types'

const CONVENTIONAL_COMMIT_REGEX = /^(\w+)(?:\([\w-]+\))?(!)?:\s/

const BREAKING_CHANGE_FOOTER = 'BREAKING CHANGE'

export function detectBumpFromMessages(
	messages: string[],
	majorKeywords: string[],
	minorKeywords: string[],
	patchKeywords: string[],
): BumpResult {
	const bumps: BumpType[] = []
	const reasons: string[] = []

	for (const message of messages) {
		const conventionalBump = detectConventionalBump(message)
		if (conventionalBump !== 'none') {
			bumps.push(conventionalBump)
			reasons.push(`conventional commit "${message.split('\n')[0]}" → ${conventionalBump}`)
			continue
		}

		const keywordBump = detectKeywordBump(message, majorKeywords, minorKeywords, patchKeywords)
		if (keywordBump !== 'none') {
			bumps.push(keywordBump)
			reasons.push(`keyword match in "${message.split('\n')[0]}" → ${keywordBump}`)
		}
	}

	const result = highestBump(bumps)

	return {
		reason: reasons.length > 0 ? reasons.join('; ') : 'no keywords or conventional commits detected',
		type: result,
	}
}

export function detectConventionalBump(message: string): BumpType {
	const match = CONVENTIONAL_COMMIT_REGEX.exec(message)

	if (message.includes(BREAKING_CHANGE_FOOTER)) return 'major'
	if (match?.[2] === '!') return 'major'
	if (match?.[1] === 'feat') return 'minor'
	if (match?.[1] === 'fix') return 'patch'

	return 'none'
}

export function detectKeywordBump(
	text: string,
	majorKeywords: string[],
	minorKeywords: string[],
	patchKeywords: string[],
): BumpType {
	const lowerText = text.toLowerCase()

	for (const keyword of majorKeywords) {
		if (lowerText.includes(keyword.toLowerCase())) return 'major'
	}

	for (const keyword of minorKeywords) {
		if (lowerText.includes(keyword.toLowerCase())) return 'minor'
	}

	for (const keyword of patchKeywords) {
		if (lowerText.includes(keyword.toLowerCase())) return 'patch'
	}

	return 'none'
}

export function highestBump(bumps: BumpType[]): BumpType {
	let highest: BumpType = 'none'
	for (const bump of bumps) {
		if (BUMP_PRIORITY[bump] > BUMP_PRIORITY[highest]) {
			highest = bump
		}
	}

	return highest
}
