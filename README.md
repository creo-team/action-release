# Action Release

**One action. Zero config to start.** Automated GitHub releases with semantic versioning, conventional commits, changelogs, and optional LLM-powered notes.

```yaml
- uses: creo-team/action-release@v1
```

---

## Copy This (30 seconds)

Paste this into `.github/workflows/release.yml`. Push to `main` — done.

```yaml
name: Release
on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: creo-team/action-release@v1
```

**What happens:** Scans commits since the last tag, bumps version (patch by default), creates a tag and GitHub Release. Uses `feat:` → minor, `fix:` → patch, `BREAKING CHANGE` → major.

**Want a changelog?** Add `changelog: true` — the action will generate one and use it as the release body automatically.

---

## Try It First (Dry Run)

Want to see what would happen without creating anything? Add `dry-run: true`:

```yaml
- uses: creo-team/action-release@v1
  with:
    dry-run: true
```

Check the **Summary** tab in the Actions run — you'll see the version, tag, and changelog that would be created. Safe to run on every PR.

---

## Quick Start Options

| Use case | Add this |
|----------|----------|
| Changelog in release body | `changelog: true` |
| From package.json | `version-source: package-json` |
| Explicit version | `version: '2.0.0'` |
| Test first (no release) | `dry-run: true` |

```yaml
# Minimal + changelog (recommended)
- uses: creo-team/action-release@v1
  with:
    changelog: true

# From package.json
- uses: creo-team/action-release@v1
  with:
    version-source: package-json

# Explicit version
- uses: creo-team/action-release@v1
  with:
    version: '2.0.0'
```

---

## Features

| Feature | Description | Required Config |
|---------|-------------|-----------------|
| **Semantic Version Bumping** | Auto-detect major/minor/patch from commits or PR | None (default) |
| **Conventional Commits** | Parse `feat:`, `fix:`, `BREAKING CHANGE` | None (built-in) |
| **Configurable Keywords** | Custom keyword lists for each bump level | `major-keywords`, `minor-keywords`, `patch-keywords` |
| **Tag Strategies** | Publish `v1`, `v1.0`, `v1.0.9` — any combination | `tag-strategy` |
| **Pre-release Channels** | `alpha`, `beta`, `rc` with auto-incrementing | `channel` |
| **Release Notes Templates** | Mustache-style `{{variables}}` in body | `body-template` |
| **Conventional Changelog** | Grouped by type (Features, Fixes, etc.) | `changelog: true` |
| **LLM-Powered Notes** | AI-generated release summaries | `llm-release-notes: true` + API key |
| **Codename Generation** | Unique release names from themed word lists | `codename: adjective-animal` |
| **Asset Uploads** | Glob-based file attachment | `files` |
| **Changelog File Updates** | Auto-prepend to CHANGELOG.md | `update-changelog: true` |
| **Dry Run** | Preview everything without side effects | `dry-run: true` |
| **Idempotent Releases** | Skip, fail, or update on duplicates | `if-exists` |
| **Notifications** | Slack, Discord, Teams, generic webhook | Webhook URL inputs |
| **Step Summary** | Rich markdown in the Actions Summary tab | Always on |
| **Comparison URLs** | Full diff link between releases | Always in outputs |
| **Version from Any File** | Extract with regex from Makefile, .env, etc. | `version-source: file` |
| **Previous Release Strategy** | Control how the baseline is found | `previous-release-strategy` |

---

## Inputs

### Version Resolution

| Input | Description | Default |
|-------|-------------|---------|
| `version` | Explicit version (e.g. `1.2.3`). Overrides auto-detection. | — |
| `version-source` | `auto`, `package-json`, `file`, `manual` | `auto` |
| `version-file` | Path to file with version (for `file` source) | — |
| `version-pattern` | Regex capture group for version extraction | `"version":\s*"([^"]+)"` |
| `default-bump` | Fallback bump: `major`, `minor`, `patch`, `none` | `patch` |
| `initial-version` | Starting version when no tags exist | `0.1.0` |

### Bump Keywords

| Input | Description | Default |
|-------|-------------|---------|
| `major-keywords` | Comma-separated major bump triggers | `BREAKING CHANGE,major,!:` |
| `minor-keywords` | Comma-separated minor bump triggers | `feat,feature,minor` |
| `patch-keywords` | Comma-separated patch bump triggers | `fix,bug,patch,chore,refactor` |
| `bump-source` | Where to scan: `commits`, `pr-title`, `pr-body`, `all` | `commits` |

### Tags

| Input | Description | Default |
|-------|-------------|---------|
| `tag-prefix` | Prefix for tags (set `""` for no prefix) | `v` |
| `tag-strategy` | `full`, `all`, `full-and-minor` | `full` |

### Pre-release Channels

| Input | Description | Default |
|-------|-------------|---------|
| `channel` | `stable`, `alpha`, `beta`, `rc`, or custom | `stable` |

### Release Controls

| Input | Description | Default |
|-------|-------------|---------|
| `draft` | Create a draft release | `false` |
| `prerelease` | Mark as prerelease (auto-set for non-stable channels) | `false` |
| `make-latest` | `true`, `false`, `legacy` | `true` |
| `target-commitish` | Branch or SHA for the tag | Current ref |
| `discussion-category` | Link to a discussion category | — |
| `if-exists` | On duplicate: `skip`, `fail`, `update` | `skip` |

### Release Notes

| Input | Description | Default |
|-------|-------------|---------|
| `body` | Static markdown body | — |
| `body-path` | Path to markdown file | — |
| `body-template` | Template with `{{variables}}` | — |
| `append-body` | Append to existing body | `false` |
| `generate-release-notes` | Use GitHub auto-generated notes | `false` |

### Release Name & Codename

| Input | Description | Default |
|-------|-------------|---------|
| `name` | Explicit release name | — |
| `name-template` | Template (e.g. `{{version}} "{{codename}}"`) | — |
| `codename` | Theme: `off`, `adjective-animal`, `the-office`, `planets`, `mythology`, `gemstones`, `ships`, `custom` | `off` |
| `codename-words` | Custom word list (comma or newline separated) | — |

### Changelog

| Input | Description | Default |
|-------|-------------|---------|
| `changelog` | Generate conventional changelog. When true, also sets release body automatically. | `false` |
| `update-changelog` | Prepend to changelog file | `false` |
| `changelog-path` | Path to changelog file | `CHANGELOG.md` |

### LLM Release Notes

| Input | Description | Default |
|-------|-------------|---------|
| `llm-release-notes` | Enable LLM-powered release notes | `false` |
| `llm-provider` | `openai`, `anthropic`, `openrouter` | `openai` |
| `llm-api-key` | API key (use a secret) | — |
| `llm-model` | Model override | Per-provider default |
| `llm-prompt` | Custom system prompt | Built-in prompt |
| `llm-max-tokens` | Max response tokens | `1024` |
| `llm-context` | What to send: `commits`, `diff`, `both` | `commits` |

### Assets

| Input | Description | Default |
|-------|-------------|---------|
| `files` | Newline-delimited glob patterns | — |
| `working-directory` | Base directory for globs | `.` |
| `overwrite-files` | Overwrite existing assets | `true` |
| `fail-on-unmatched-files` | Fail on unmatched globs | `false` |

### Notifications

| Input | Description | Default |
|-------|-------------|---------|
| `slack-webhook` | Slack incoming webhook URL | — |
| `discord-webhook` | Discord webhook URL | — |
| `teams-webhook` | Microsoft Teams webhook URL | — |
| `webhook-url` | Generic webhook (JSON POST) | — |
| `notification-template` | Custom message template | — |

### Previous Release

| Input | Description | Default |
|-------|-------------|---------|
| `previous-release-strategy` | `latest-release`, `latest-tag`, `tag-pattern`, `specific-tag` | `latest-tag` |
| `previous-tag` | Specific tag for comparison | — |
| `tag-match-pattern` | Glob for tag matching | — |

### Behavior

| Input | Description | Default |
|-------|-------------|---------|
| `dry-run` | Preview without side effects | `false` |
| `token` | GitHub token | `${{ github.token }}` |

---

## Outputs

| Output | Description |
|--------|-------------|
| `tag` | Primary tag (e.g. `v1.0.9`) |
| `version` | Version without prefix (`1.0.9`) |
| `major` | Major version number |
| `minor` | Minor version number |
| `patch` | Patch version number |
| `tags` | JSON array of all tags created/moved |
| `previous-tag` | Previous release tag |
| `compare-url` | GitHub compare URL between releases |
| `url` | Release page URL |
| `id` | Release ID |
| `upload-url` | Asset upload URL |
| `created` | `true` if release was created |
| `codename` | Generated codename |
| `release-name` | Final release name |
| `changelog` | Conventional changelog markdown |
| `llm-summary` | LLM-generated summary |
| `body` | Final rendered body |
| `dry-run` | `true` if dry run |

---

## Template Variables

Available in `body-template`, `name-template`, and `notification-template`:

| Variable | Example | Description |
|----------|---------|-------------|
| `{{tag}}` | `v1.2.0` | Full tag with prefix |
| `{{version}}` | `1.2.0` | Version without prefix |
| `{{major}}` | `1` | Major version |
| `{{minor}}` | `2` | Minor version |
| `{{patch}}` | `0` | Patch version |
| `{{commit}}` | `a1b2c3d...` | Full commit SHA |
| `{{commit_short}}` | `a1b2c3d` | Short SHA (7 chars) |
| `{{previous_tag}}` | `v1.1.0` | Previous release tag |
| `{{compare_url}}` | `https://...` | Diff URL between releases |
| `{{changes}}` | (multiline) | Raw commit log since previous tag |
| `{{changelog}}` | (multiline) | Structured conventional changelog |
| `{{llm_summary}}` | (multiline) | LLM-generated summary |
| `{{codename}}` | `Swift Falcon` | Generated codename |
| `{{date}}` | `2025-06-15` | ISO release date |
| `{{repo}}` | `creo-team/app` | Repository `owner/repo` |
| `{{owner}}` | `creo-team` | Repository owner |
| `{{branch}}` | `main` | Branch or ref name |
| `{{actor}}` | `octocat` | User who triggered the workflow |
| `{{release_url}}` | `https://...` | Release page URL |
| `{{release_name}}` | `v1.2.0 "Swift Falcon"` | Final release name |

---

## Examples

### Conventional Commits with Changelog

```yaml
- uses: creo-team/action-release@v1
  with:
    changelog: true
```

With `changelog: true`, the release body is auto-generated (What's Changed + Full Changelog link). Override with `body-template` if you want a custom layout.

### Tag Strategy: Publish All Levels

```yaml
- uses: creo-team/action-release@v1
  with:
    tag-strategy: all
```

Creates `v1`, `v1.0`, and `v1.0.9`. The major and minor tags are moved forward on each release — useful for actions and libraries where consumers pin to `@v1`.

### Pre-release Channel

```yaml
- uses: creo-team/action-release@v1
  with:
    channel: beta
```

Produces tags like `v1.2.0-beta.1`, auto-incrementing the pre-release number. Automatically marks the release as a prerelease.

### Custom Keywords

```yaml
- uses: creo-team/action-release@v1
  with:
    major-keywords: 'BREAKING,breaking-change,💥'
    minor-keywords: 'feat,feature,enhancement,✨'
    patch-keywords: 'fix,bugfix,hotfix,🐛'
    bump-source: all
```

### Release from PR Title

```yaml
name: Release
on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  release:
    if: github.event.pull_request.merged
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: creo-team/action-release@v1
        with:
          bump-source: pr-title
```

### Draft Release with Assets

```yaml
- uses: creo-team/action-release@v1
  with:
    draft: true
    files: |
      dist/*.zip
      dist/*.tar.gz
    body-template: |
      ## {{tag}}
      Built from {{commit_short}} on {{date}}.
```

### Codename Generation

```yaml
- uses: creo-team/action-release@v1
  with:
    codename: adjective-animal
    name-template: '{{version}} "{{codename}}"'
```

Produces release names like `1.2.0 "Swift Falcon"`. Names are guaranteed unique within the repository.

**Available themes:**

| Theme | Examples |
|-------|---------|
| `adjective-animal` | Swift Falcon, Brave Otter, Silent Wolf |
| `the-office` | Threat Level Midnight, Prison Mike, Date Mike |
| `planets` | Neptune, Europa, Titan, Callisto |
| `mythology` | Atlas, Phoenix, Odin, Athena |
| `gemstones` | Obsidian, Sapphire, Emerald, Topaz |
| `ships` | Endeavour, Discovery, Intrepid, Resolute |
| `custom` | Your own word list via `codename-words` |

### Dry Run (Test Without Releasing)

```yaml
- uses: creo-team/action-release@v1
  id: preview
  with:
    dry-run: true
    changelog: true

- run: |
    echo "Would create tag: ${{ steps.preview.outputs.tag }}"
    echo "Version: ${{ steps.preview.outputs.version }}"
    echo "Changelog:"
    echo "${{ steps.preview.outputs.changelog }}"
```

**Pro tip:** Run this on every PR. The action writes a rich Summary — open the run and check the Summary tab.

### Idempotent Releases

```yaml
- uses: creo-team/action-release@v1
  with:
    if-exists: skip
```

If the tag already exists, the action succeeds without creating a duplicate. Set to `update` to update an existing release's body/assets, or `fail` to error out.

### Notifications

```yaml
- uses: creo-team/action-release@v1
  with:
    slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
    discord-webhook: ${{ secrets.DISCORD_WEBHOOK }}
    notification-template: '🚀 *{{repo}}* {{tag}} released! {{release_url}}'
```

### Using Outputs

```yaml
- uses: creo-team/action-release@v1
  id: release

- run: echo "Released ${{ steps.release.outputs.tag }}"

- name: Deploy
  if: steps.release.outputs.created == 'true'
  run: ./deploy.sh ${{ steps.release.outputs.version }}
```

---

## LLM-Powered Release Notes

**Optional.** Add AI-generated summaries to your releases. Works with OpenAI, Anthropic, or OpenRouter. Disabled by default — no API key needed for basic use.

### Minimal Setup (3 inputs)

```yaml
- uses: creo-team/action-release@v1
  with:
    llm-release-notes: true
    llm-api-key: ${{ secrets.OPENAI_API_KEY }}
    body-template: |
      {{llm_summary}}

      <details><summary>Commit log</summary>{{changes}}</details>
```

### LLM-Friendly: Copy-Paste Prompts

These prompts work well. Paste into `llm-prompt`:

**Friendly & concise:**
```yaml
llm-prompt: |
  Write release notes in 2-4 short paragraphs. Friendly tone.
  Group into: What's New, Fixes, Other. Bullet points. Under 200 words.
  Highlight breaking changes at the top.
```

**Technical & detailed:**
```yaml
llm-prompt: |
  Technical release notes. Sections: Added, Changed, Fixed, Removed.
  Use bullet points. Be precise. Under 400 words.
  Call out breaking changes with a ⚠️ prefix.
```

**For AI agents / changelog consumers:**
```yaml
llm-prompt: |
  Structured release summary for automated parsing.
  Output valid markdown with ## headers: Summary, Changes, Breaking.
  One sentence per change. No fluff.
```

### Providers

| Provider | Default Model | Set with |
|----------|---------------|----------|
| `openai` | `gpt-4o-mini` | `llm-provider: openai` |
| `anthropic` | `claude-sonnet-4-20250514` | `llm-provider: anthropic` |
| `openrouter` | `openai/gpt-4o-mini` | `llm-provider: openrouter` |

Override: `llm-model: gpt-4o`

### Context (what gets sent to the LLM)

| Value | Best for | Cost |
|-------|----------|------|
| `commits` | Most projects | Low |
| `diff` | Code-heavy releases | Medium |
| `both` | Maximum detail | Higher |

### LLM + Changelog Together

```yaml
- uses: creo-team/action-release@v1
  with:
    changelog: true
    llm-release-notes: true
    llm-api-key: ${{ secrets.OPENAI_API_KEY }}
    body-template: |
      {{llm_summary}}

      ## Detailed Changes
      {{changelog}}

      **Compare**: {{compare_url}}
```

### Security & Cost

- Store API key in GitHub Secrets — never in the workflow file.
- Only commit messages and/or diffs are sent. No other repo data.
- `commits` context: ~100–500 tokens. `diff`: varies. Use `llm-max-tokens` (default 1024) to cap output.

---

## Version Resolution

The action determines the next version through a priority chain:

```
1. version input (explicit)       → "1.2.3"
2. version-source: package-json   → reads from package.json
3. version-source: file           → extracts via regex from any file
4. version-source: auto (default) → bumps from last tag using keywords
```

For `auto` mode, the action:

1. Finds the previous release tag (configurable via `previous-release-strategy`)
2. Scans commits and/or PR metadata for bump keywords
3. Applies the highest-priority bump found (major > minor > patch)
4. Falls back to `default-bump` if no keywords match
5. If no previous tag exists, uses `initial-version`

---

## Tag Strategies

| Strategy | Tags Created | Use Case |
|----------|-------------|----------|
| `full` | `v1.0.9` | Most projects — one tag per release |
| `all` | `v1`, `v1.0`, `v1.0.9` | GitHub Actions, libraries — consumers pin to `@v1` |
| `full-and-minor` | `v1.0`, `v1.0.9` | When minor-level pinning is needed |

With `all` and `full-and-minor`, the shorter tags are **moved forward** on each release. For example, releasing `v1.0.9` moves the `v1` tag to point at the same commit.

---

## Previous Release Strategy

How the action finds the baseline for changelogs, diffs, and version bumping:

| Strategy | Description |
|----------|-------------|
| `latest-tag` | Most recent semver tag (default) |
| `latest-release` | Most recent GitHub Release |
| `tag-pattern` | Latest tag matching a glob (e.g. `v2.*`) |
| `specific-tag` | A specific tag you provide |

---

## Testing

### Test on Every PR (Recommended)

Add a dry-run job to your release workflow:

```yaml
name: Release
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read  # read-only for PRs
  pull-requests: read

jobs:
  release:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: creo-team/action-release@v1

  # Preview on PRs — no tags or releases created
  preview:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: creo-team/action-release@v1
        with:
          dry-run: true
          changelog: true
```

PRs get a preview in the Summary tab. Pushes to `main` create real releases.

### Run Unit Tests (Contributors)

The action has 100+ Vitest tests. To run them:

```bash
cd action-release
npm install
npm test
```

---

## Permissions

The action requires `contents: write` to create tags and releases:

```yaml
permissions:
  contents: write
```

If using `bump-source: pr-title` or `pr-body`, also add:

```yaml
permissions:
  contents: write
  pull-requests: read
```

---

## Troubleshooting

### "No previous tag found"

The action uses `initial-version` (default `0.1.0`) when there are no existing tags. Make sure `fetch-depth: 0` is set on `actions/checkout` so the action can see the full tag history.

### "Tag already exists"

Set `if-exists` to control behavior:

- `skip` (default): succeed silently
- `update`: update the existing release body/assets
- `fail`: exit with an error

### Keywords not detected

- Verify `bump-source` matches your trigger (`commits` for push, `pr-title` for PR)
- Check keyword spelling (case-insensitive matching)
- Use `dry-run: true` to see what the action detects

### LLM notes empty or erroring

- Verify the API key is set correctly as a secret
- Check the provider name matches (`openai`, `anthropic`, `openrouter`)
- Review the step output/logs for API error messages

---

## License

MIT
