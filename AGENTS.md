# Agent Instructions

Instructions for AI coding agents (Claude Code, Cursor, Copilot, etc.) working in this codebase. For comprehensive project context, see [CLAUDE.md](CLAUDE.md).

## Project

**action-release** — reusable GitHub Action for automated releases. TypeScript compiled to `dist/index.js`. Semantic versioning, conventional commits, tag strategies, LLM-powered notes, codename generation, notifications. Uses `@actions/core`, `@actions/github`, Vitest.

## Required Reading

| Area | Document |
|------|----------|
| All changes | [CLAUDE.md](CLAUDE.md) — single source of truth for conventions |
| Action spec | [action.yml](action.yml) — all inputs and outputs |
| User docs | [README.md](README.md) — examples and feature reference |

## Core Rules

- **Never nest** — early returns, flat code. If you're indenting more than once, refactor
- **No narration comments** — code speaks for itself. Only comment non-obvious intent or trade-offs. No section banners
- **Zero magic values** — constants and string literal unions for all identifiers
- **Deduplicate ruthlessly** — shared data in shared modules, not copied between files
- **TypeScript only** — no `.js`/`.jsx` in application code. Strict mode enabled
- **Turbopack** — use `--turbopack` flag for Next.js dev and build (where applicable)
- **Latest stable versions** — stay current with Next.js, React, and dependencies. Adopt new features early
- **Skeleton loading** — every async boundary needs a loading state. Use `loading.tsx`, `Suspense` fallbacks, and skeleton UI. No blank screens
- **Simple over clever** — readable beats terse
- **Verb-driven names** — `get`, `remove`, `create`, `list` over `fetch`, `delete`, `post`
- **Types in `types.ts`** — never scatter type definitions across implementation files
- **Defensive guards** — verify assumptions with `if` checks and logging
- Functions under 50 lines — if it's longer, extract
- No `any` — prefer `unknown` and narrow with type guards
- `null` for intentionally empty, `undefined` for "not provided"
- **Version bumps** — increment `package.json` version with every push to `main`. Feature branches: one bump before merge
- Conventional commits: `feat(scope):`, `fix(scope):`, `refactor(scope):`

## Key Files

| File | Purpose |
|------|---------|
| `src/types.ts` | All shared types and constants |
| `src/inputs.ts` | Parse and validate action inputs |
| `src/index.ts` | Entry point — orchestrates all modules |
| `src/llm.ts` | LLM integration (OpenAI, Anthropic, OpenRouter) |
| `src/codename.ts` | 7 codename themes + uniqueness check |
| `action.yml` | Action metadata |

## File Conventions

| File | Role |
|------|------|
| `*.ts` | Source modules (one concern per file) |
| `__tests__/*.test.ts` | Vitest unit tests |
| `types.ts` | Shared types, constants, string literal unions |

## Testing

- Vitest in `src/__tests__/`
- Mock `@actions/core` and `@actions/github` — no real API calls
- Pattern: `describe('functionName')` → `it('returns X when Y')`
- Optional features (LLM, webhooks) must never crash — test error paths

## Verification

```bash
npm run typecheck
npm test
npm run build
```

All three must pass. Rebuild `dist/` before committing.
