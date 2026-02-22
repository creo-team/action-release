# action-release — Claude Code Instructions

## Project Overview

Reusable GitHub Action for automated releases. TypeScript compiled to a single `dist/index.js` via `@vercel/ncc`. Provides semantic version bumping, conventional commit detection, flexible tag strategies, release notes templating, LLM-powered summaries, codename generation, notifications, and more.

**Repository:** `creo-team/action-release`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| Runtime | Node.js 20 (GitHub Actions runner) |
| Bundler | @vercel/ncc (single-file output to dist/) |
| Testing | Vitest |
| GitHub API | @actions/core, @actions/github, @actions/glob |
| Codenames | unique-names-generator |

## Before Making Changes

1. Read this file for conventions
2. Read `action.yml` to understand all inputs and outputs
3. Review `README.md` for user-facing documentation

## Key Conventions

### Code Style

- **Zero magic values** — enums and constants for all identifiers, thresholds, and config
- **Finite states** → string literal unions or enums (`BumpType`, `TagStrategy`, `LlmProvider`)
- **Configuration** → named constants (e.g. `DEFAULT_INITIAL_VERSION`, `MAX_LLM_TOKENS`)
- Functions under 50 lines, prefer early returns over nested conditionals
- `null` for intentionally empty values, `undefined` for "not provided"
- Conventional commits: `feat(scope):`, `fix(scope):`, `refactor(scope):`

### TypeScript

- Strict mode, no `any` — prefer `unknown` and narrow with type guards
- Use string literal unions for finite sets: `type BumpType = 'major' | 'minor' | 'patch' | 'none'`
- Use `satisfies` for type-safe const objects
- Use `Record<K, V>` for exhaustive mappings
- Validate all external input at boundaries (action inputs, API responses)

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `previous-release.ts`, `changelog-file.ts` |
| Functions | camelCase | `resolveVersion()`, `detectBump()` |
| Types/Interfaces | PascalCase | `ReleaseConfig`, `BumpResult` |
| Constants | UPPER_SNAKE | `DEFAULT_BUMP`, `LLM_PROVIDERS` |
| Enums/Unions | PascalCase values | `type TagStrategy = 'full' \| 'all' \| 'full-and-minor'` |

### Import Order

1. Node built-ins (`path`, `fs`)
2. External packages (`@actions/core`, `@actions/github`)
3. Internal modules (`./types`, `./version`)

### File Organization

| File | Purpose |
|------|---------|
| `types.ts` | All shared TypeScript types and constants |
| `inputs.ts` | Parse and validate action inputs from `@actions/core` |
| `version.ts` | Version resolution from all sources |
| `bump.ts` | Keyword detection, conventional commit parsing |
| `tags.ts` | Tag string generation for all strategies |
| `release.ts` | GitHub Release creation/update via API |
| `template.ts` | Mustache-style template rendering |
| `changelog.ts` | Conventional changelog generation |
| `changelog-file.ts` | CHANGELOG.md file operations |
| `codename.ts` | Release codename generation (all themes) |
| `llm.ts` | LLM release notes (OpenAI, Anthropic, OpenRouter) |
| `notifications.ts` | Webhook notifications (Slack, Discord, Teams) |
| `assets.ts` | File glob matching and upload |
| `summary.ts` | GitHub Step Summary rendering |
| `previous-release.ts` | Previous release/tag detection |
| `index.ts` | Entry point — orchestrates all modules |

### Testing

- Vitest in `src/__tests__/` alongside source
- Test naming: `describe('functionName')` → `it('returns X when Y')`
- Mock `@actions/core` and `@actions/github` — never call real APIs in tests
- Test pure functions first (bump detection, template rendering, version parsing)
- Each module has a corresponding test file

### Error Handling

- Use `core.setFailed()` for fatal errors
- Use `core.warning()` for non-fatal issues (e.g. LLM API timeout, no keywords found)
- Wrap external API calls (LLM, webhooks) in try/catch — never let optional features crash the action
- Validate inputs early and fail with clear messages

## Key File Map

| File | Purpose |
|------|---------|
| `action.yml` | Action metadata — all inputs, outputs, branding |
| `src/index.ts` | Entry point and orchestration |
| `src/types.ts` | Shared types and constants |
| `src/inputs.ts` | Input parsing and validation |
| `src/llm.ts` | LLM integration (3 providers) |
| `src/codename.ts` | 7 codename themes + uniqueness |
| `dist/index.js` | Compiled output (committed to repo) |

## Verification

From repo root:

```bash
npm run typecheck
npm test
npm run build
```

All three must pass. The `dist/` directory is committed — always rebuild before committing changes.
