# Action Release

[![Release](https://img.shields.io/github/v/release/creo-team/action-release)](https://github.com/creo-team/action-release/releases)
[![License](https://img.shields.io/github/license/creo-team/action-release)](./LICENSE)

One action. Zero config to start. Semantic versioning, conventional commits, changelogs, optional LLM notes.

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

## Common patterns

### Changelog in release body

```yaml
- uses: creo-team/action-release@v1
  with:
    changelog: true
```

### From package.json

```yaml
- uses: creo-team/action-release@v1
  with:
    version-source: package-json
```

### Explicit version

```yaml
- uses: creo-team/action-release@v1
  with:
    version: '2.0.0'
```

### Dry run (preview, no release)

```yaml
- uses: creo-team/action-release@v1
  with:
    dry-run: true
```

### Floating tags (1, 1.0, 1.0.9)

Publish all three tag levels so consumers can pin to a major or minor:

```yaml
- uses: creo-team/action-release@v1
  with:
    floating-tags: true
```

`floating-tags: true` overrides `tag-strategy`. Equivalent to `tag-strategy: all` but cleaner to read.

### Tag strategy: v1, v1.0, v1.0.9 (for actions/libraries)

```yaml
- uses: creo-team/action-release@v1
  with:
    tag-strategy: all
```

### Publish to GitHub Marketplace (Actions only)

GitHub does not expose Marketplace publishing via the API. When `publish-to-marketplace: true`, the step summary includes a direct link to edit the release and a one-line reminder. Org owner must [accept the Marketplace Developer Agreement](https://docs.github.com/en/apps/github-marketplace/listing-an-app-on-github-marketplace/submitting-your-listing-for-publication) first.

```yaml
- uses: creo-team/action-release@v1
  with:
    publish-to-marketplace: true
```

### Pre-release channel (beta, alpha, rc)

```yaml
- uses: creo-team/action-release@v1
  with:
    channel: beta
```

### LLM-powered notes (OpenRouter default)

```yaml
- uses: creo-team/action-release@v1
  with:
    llm-release-notes: true
    llm-api-key: ${{ secrets.OPENROUTER_API_KEY }}
    body-template: |
      {{llm_summary}}

      <details><summary>Commits</summary>{{changes}}</details>
```

---

## Features

| Feature | Description | Required Config |
|---------|-------------|-----------------|
| **Semantic Version Bumping** | Auto-detect major/minor/patch from commits or PR | None (default) |
| **Conventional Commits** | Parse `feat:`, `fix:`, `BREAKING CHANGE` | None (built-in) |
| **Configurable Keywords** | Custom keyword lists for each bump level | `major-keywords`, `minor-keywords`, `patch-keywords` |
| **Tag Strategies** | Publish `v1`, `v1.0`, `v1.0.9` — any combination | `tag-strategy` |
| **Floating Tags** | Boolean shorthand to publish all three tag levels | `floating-tags: true` |
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
| **Marketplace Publishing** | Step-summary link + one-line reminder to publish Action to Marketplace (API does not support this) | `publish-to-marketplace: true` |

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

### Minimal setup (3 inputs)

Uses OpenRouter by default. Add your [OpenRouter API key](https://openrouter.ai/keys):

```yaml
- uses: creo-team/action-release@v1
  with:
    llm-release-notes: true
    llm-api-key: ${{ secrets.OPENROUTER_API_KEY }}
    body-template: |
      {{llm_summary}}

      <details><summary>Commits</summary>{{changes}}</details>
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

| Provider | Default model | Set with |
|----------|---------------|----------|
| `openrouter` | `openai/gpt-4o-mini` | default |
| `openai` | `gpt-4o-mini` | `llm-provider: openai` |
| `anthropic` | `claude-sonnet-4-20250514` | `llm-provider: anthropic` |

Override model: `llm-model: gpt-4o`

### Default prompt

When `llm-prompt` is not set, the action uses:

> Write release notes from the commit history. Be clear and concise.
> Sections: What's New, Fixes, Other (omit empty). Bullet points. Under 200 words.
> Put breaking changes first with a brief warning. Professional tone.

Override with `llm-prompt` to customize tone or format.

### Context (what gets sent to the LLM)

| Value | Best for | Cost |
|-------|----------|------|
| `commits` | Most projects | Low |
| `diff` | Code-heavy releases | Medium |
| `both` | Maximum detail | Higher |

### LLM + changelog together

```yaml
- uses: creo-team/action-release@v1
  with:
    changelog: true
    llm-release-notes: true
    llm-api-key: ${{ secrets.OPENROUTER_API_KEY }}
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

Priority: `version` input overrides everything. Otherwise:

| Source | When |
|--------|------|
| `version` | Explicit (e.g. `version: '1.2.3'`) |
| `package-json` | Read from package.json |
| `file` | Extract via regex from any file |
| `auto` (default) | Bump from last tag using commit keywords |

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
- Default provider is OpenRouter; use `llm-provider: openai` or `anthropic` if needed
- Review the step output/logs for API error messages

---

## Reference

### Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `version` | — | Explicit version. Overrides auto-detection. |
| `version-source` | `auto` | `auto`, `package-json`, `file` (version overrides) |
| `default-bump` | `patch` | Fallback when no keywords match |
| `tag-prefix` | `v` | Tag prefix. Empty for none. |
| `tag-strategy` | `full` | `full`, `all`, `full-and-minor` |
| `floating-tags` | `false` | Publish major, minor, and patch tags. Overrides `tag-strategy`. |
| `channel` | `stable` | `stable`, `alpha`, `beta`, `rc`, or custom |
| `changelog` | `false` | Generate changelog and set release body |
| `llm-release-notes` | `false` | Enable LLM notes |
| `llm-provider` | `openrouter` | `openrouter`, `openai`, `anthropic` |
| `dry-run` | `false` | Preview without creating anything |
| `if-exists` | `skip` | When tag exists: `skip`, `fail`, `update` |
| `publish-to-marketplace` | `false` | Add step-summary link + reminder to publish Action to Marketplace |

Full list in [action.yml](./action.yml).

### Outputs

| Output | Description |
|--------|-------------|
| `tag` | Primary tag (e.g. `v1.0.9`) |
| `version` | Version without prefix |
| `compare-url` | Diff URL between releases |
| `url` | Release page URL |
| `created` | `true` if release was created |
| `changelog` | Conventional changelog markdown |
| `llm-summary` | LLM-generated summary |

### Template variables

Use in `body-template`, `name-template`, `notification-template`:

`{{tag}}` `{{version}}` `{{commit_short}}` `{{previous_tag}}` `{{compare_url}}` `{{changelog}}` `{{llm_summary}}` `{{codename}}` `{{date}}` `{{repo}}` `{{branch}}` `{{actor}}` `{{release_url}}` `{{release_name}}` `{{changes}}` `{{action_release_footer}}`

Every release body includes a footer at the bottom: a horizontal rule followed by `Created by [creo-team/action-release](repo)@[version](release)`. Use `{{action_release_footer}}` to place it elsewhere in a custom `body-template`.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT
