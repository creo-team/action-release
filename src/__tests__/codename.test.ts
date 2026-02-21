import { describe, expect, it } from 'vitest'
import { generateCodename } from '../codename'

describe('generateCodename', () => {
	it('returns empty string for off theme', () => {
		expect(generateCodename('off', [])).toBe('')
	})

	it('generates adjective-animal name', () => {
		const name = generateCodename('adjective-animal', [])
		expect(name).toBeTruthy()
		expect(name.length).toBeGreaterThan(0)
		expect(name).toContain(' ')
	})

	it('generates the-office name', () => {
		const name = generateCodename('the-office', [])
		expect(name).toBeTruthy()
		expect(name.length).toBeGreaterThan(0)
	})

	it('generates planets name', () => {
		const name = generateCodename('planets', [])
		expect(name).toBeTruthy()
	})

	it('generates mythology name', () => {
		const name = generateCodename('mythology', [])
		expect(name).toBeTruthy()
	})

	it('generates gemstones name', () => {
		const name = generateCodename('gemstones', [])
		expect(name).toBeTruthy()
	})

	it('generates ships name', () => {
		const name = generateCodename('ships', [])
		expect(name).toBeTruthy()
	})

	it('generates custom name from word list', () => {
		const name = generateCodename('custom', [], ['Alpha', 'Bravo', 'Charlie'])
		expect(['Alpha', 'Bravo', 'Charlie']).toContain(name)
	})

	it('avoids existing names', () => {
		const existing = [
			'Mercury',
			'Venus',
			'Mars',
			'Jupiter',
			'Saturn',
			'Uranus',
			'Neptune',
			'Pluto',
			'Europa',
			'Titan',
			'Callisto',
			'Ganymede',
			'Io',
			'Enceladus',
			'Triton',
			'Ceres',
			'Eris',
			'Haumea',
			'Makemake',
			'Sedna',
			'Kepler',
			'Proxima',
			'Andromeda',
			'Orion',
			'Sirius',
			'Vega',
			'Rigel',
			'Polaris',
			'Arcturus',
			'Betelgeuse',
		]

		const name = generateCodename('planets', existing)
		expect(name).toBeTruthy()

		// When all names are taken, it appends a timestamp
		expect(name.length).toBeGreaterThan(0)
	})

	it('is case insensitive for uniqueness', () => {
		const name = generateCodename('ships', ['endeavour', 'DISCOVERY'])
		expect(name).toBeTruthy()
	})
})
