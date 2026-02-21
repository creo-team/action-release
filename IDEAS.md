# Ideas

Future features and enhancements under consideration. Not committed to — just tracking possibilities.

## Downstream Repository Dispatch

After releasing, trigger `repository_dispatch` events in other repos to kick off deployments or dependent builds. Would accept a list of `owner/repo` targets and a custom event type.

```yaml
dispatch-repos: |
  creo-team/app
  creo-team/docs
dispatch-event-type: release-published
```

## Monorepo / Scoped Releases

Support releasing individual packages in a monorepo with scoped tags (e.g. `@scope/pkg@v1.2.0`). Detect changes per directory to decide whether to release.

## CalVer Support

Calendar-based versioning as an alternative to SemVer. Format like `YY.MM.PATCH` (e.g. `25.06.1`).

## Release Approval Gate

Create a draft release, then wait for manual approval (via a separate workflow or API call) before publishing.

## Commit Signature Verification

Verify GPG/SSH signatures on commits before allowing a release. Useful for high-security workflows.

## npm / PyPI / Cargo Publish

Built-in publish step after release creation. Would support multiple registries with authentication.

## Release Retraction

Delete a release and its tags as a rollback mechanism. Dangerous but sometimes necessary.

## Release Metrics

Track release frequency, size (commits per release), and time-between-releases. Output as structured data for dashboards.

## Custom Webhook Payloads

Allow users to provide a full JSON template for webhook payloads instead of just a message template.

## Changelog Grouping Rules

Let users define custom commit-type-to-section mappings for the conventional changelog (e.g. map `perf:` to "Performance Improvements").
