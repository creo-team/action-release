import {
  uniqueNamesGenerator,
  adjectives,
  animals,
  colors,
} from 'unique-names-generator';
import { CodenameTheme, MAX_CODENAME_RETRIES } from './types';

// ============================================================================
// Theme Word Lists
// ============================================================================

const THE_OFFICE_NAMES = [
  'Threat Level Midnight',
  'Prison Mike',
  'Date Mike',
  'Michael Scarn',
  'Dwight Schrute',
  'Scranton Strangler',
  'Dundler Mifflin',
  'That\'s What She Said',
  'Beet Farm',
  'Paper Company',
  'Regional Manager',
  'Assistant to the Regional Manager',
  'Pretzel Day',
  'Dundie Award',
  'Finer Things Club',
  'Party Planning Committee',
  'Lazy Scranton',
  'Cafe Disco',
  'Scott\'s Tots',
  'Golden Ticket',
  'Garage Sale',
  'Fun Run',
  'Beach Games',
  'Booze Cruise',
  'Casino Night',
  'Safety Training',
  'Stress Relief',
  'Money Beet',
  'Schrute Buck',
  'Stanley Nickel',
];

const PLANET_NAMES = [
  'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
  'Uranus', 'Neptune', 'Pluto', 'Europa', 'Titan',
  'Callisto', 'Ganymede', 'Io', 'Enceladus', 'Triton',
  'Ceres', 'Eris', 'Haumea', 'Makemake', 'Sedna',
  'Kepler', 'Proxima', 'Andromeda', 'Orion', 'Sirius',
  'Vega', 'Rigel', 'Polaris', 'Arcturus', 'Betelgeuse',
];

const MYTHOLOGY_NAMES = [
  'Atlas', 'Phoenix', 'Odin', 'Athena', 'Thor',
  'Apollo', 'Artemis', 'Hermes', 'Poseidon', 'Hera',
  'Zeus', 'Loki', 'Freya', 'Ares', 'Hephaestus',
  'Persephone', 'Demeter', 'Dionysus', 'Helios', 'Selene',
  'Prometheus', 'Pandora', 'Icarus', 'Medusa', 'Pegasus',
  'Cerberus', 'Minotaur', 'Valkyrie', 'Fenrir', 'Ragnarok',
];

const GEMSTONE_NAMES = [
  'Obsidian', 'Sapphire', 'Emerald', 'Topaz', 'Ruby',
  'Diamond', 'Amethyst', 'Opal', 'Jade', 'Garnet',
  'Onyx', 'Pearl', 'Quartz', 'Turquoise', 'Amber',
  'Citrine', 'Peridot', 'Moonstone', 'Lapis', 'Malachite',
  'Agate', 'Jasper', 'Tanzanite', 'Zircon', 'Alexandrite',
  'Aquamarine', 'Beryl', 'Coral', 'Sunstone', 'Bloodstone',
];

const SHIP_NAMES = [
  'Endeavour', 'Discovery', 'Intrepid', 'Resolute', 'Defiant',
  'Enterprise', 'Voyager', 'Challenger', 'Pathfinder', 'Pioneer',
  'Navigator', 'Vanguard', 'Horizon', 'Expedition', 'Odyssey',
  'Meridian', 'Constellation', 'Aurora', 'Tempest', 'Sovereign',
  'Vigilant', 'Relentless', 'Dauntless', 'Valiant', 'Indomitable',
  'Fortitude', 'Perseverance', 'Endurance', 'Dreadnought', 'Leviathan',
];

// ============================================================================
// Generation
// ============================================================================

export function generateCodename(
  theme: CodenameTheme,
  existingNames: string[],
  customWords?: string[]
): string {
  if (theme === 'off') return '';

  const existingSet = new Set(
    existingNames.map((n) => n.toLowerCase())
  );

  for (let attempt = 0; attempt < MAX_CODENAME_RETRIES; attempt++) {
    const candidate = generateCandidate(theme, customWords);
    if (!existingSet.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  const timestamp = Date.now().toString(36);
  const fallback = generateCandidate(theme, customWords);
  return `${fallback} ${timestamp}`;
}

function generateCandidate(
  theme: CodenameTheme,
  customWords?: string[]
): string {
  switch (theme) {
    case 'adjective-animal':
      return generateAdjectiveAnimal();
    case 'the-office':
      return pickRandom(THE_OFFICE_NAMES);
    case 'planets':
      return pickRandom(PLANET_NAMES);
    case 'mythology':
      return pickRandom(MYTHOLOGY_NAMES);
    case 'gemstones':
      return pickRandom(GEMSTONE_NAMES);
    case 'ships':
      return pickRandom(SHIP_NAMES);
    case 'custom':
      return pickRandom(customWords ?? []);
    case 'off':
      return '';
  }
}

function generateAdjectiveAnimal(): string {
  const name = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: ' ',
    length: 2,
    style: 'capital',
  });
  return name;
}

function pickRandom(list: string[]): string {
  if (list.length === 0) return 'Unknown';
  return list[Math.floor(Math.random() * list.length)];
}

// ============================================================================
// Fetch Existing Release Names
// ============================================================================

export async function getExistingReleaseNames(
  octokit: ReturnType<typeof import('@actions/github').getOctokit>,
  owner: string,
  repo: string
): Promise<string[]> {
  const names: string[] = [];
  const PER_PAGE = 100;

  for (let page = 1; page <= 5; page++) {
    const { data } = await octokit.rest.repos.listReleases({
      owner,
      repo,
      per_page: PER_PAGE,
      page,
    });

    names.push(
      ...data.map((r) => r.name ?? '').filter(Boolean)
    );

    if (data.length < PER_PAGE) break;
  }

  return names;
}
