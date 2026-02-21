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

- **Zero magic values** — constants and string literal unions for all identifiers
- Functions under 50 lines, prefer early returns
- No `any` — prefer `unknown` and narrow with type guards
- `null` for intentionally empty, `undefined` for "not provided"
- Section headers: `// ============================================================================`
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
