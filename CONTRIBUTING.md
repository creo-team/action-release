# Contributing

## Setup

```bash
npm install
```

## Commands

- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint (@creo-team/eslint-config)
- `npm run fix` — ESLint with auto-fix
- `npm test` — Vitest
- `npm run build` — Compile to `dist/`

## Verification before submit

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Release

Trunk-based. Bump `version` in `package.json`, push `main`. The release workflow uses this action to create tags and releases. Runs when `package.json` changes.

## Project docs

See [AGENTS.md](./AGENTS.md) and [CLAUDE.md](./CLAUDE.md) for agent instructions.
