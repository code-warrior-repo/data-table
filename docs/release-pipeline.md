# GitHub Actions release pipeline

[release.yml](../.github/workflows/release.yml) releases this npm library to Artifactory on pushes to **master** and **test**, or manual dispatch on either branch. Master starts at **1.0.0** and publishes stable versions under npm's `latest` tag. Test publishes prereleases under the `test` tag. The existing qualification workflow continues to cover pushes and pull requests.

## Step order

1. Check out the latest head of the selected release branch, with full Git history.
2. Set up Node from `.nvmrc` and enable npm dependency caching.
3. Read the current version from `package.json` or `version.json`; test also reads `origin/master`.
4. Pass that current version, branch, bump type and master baseline to the external [compute-version.sh](../scripts/compute-version.sh).
5. Generate/update version metadata and synchronize lockfile references.
6. Validate all scanner/registry settings; missing configuration fails the release.
7. Install exactly the lockfile with `npm ci --ignore-scripts`.
8. Run component/unit/example tests with V8 coverage, release-automation tests, and declaration checks. Require a nonempty LCOV report.
9. Run ESLint, including release scripts.
10. Run Sonar analysis and wait for its quality gate.
11. Run Black Duck full analysis and wait for its policy result.
12. Build the library and pack one exact `.tgz` artifact, recording its integrity.
13. Check that the source branch has not advanced during qualification.
14. Publish that tarball to Artifactory and apply the branch's npm dist-tag.
15. Commit and push only version metadata/lock references, using the Actions bot and `[skip ci]`.
16. Always write a final GitHub job summary, including failed/skipped steps and partial publication outcomes.

Failed tests, lint, configuration, quality gates or builds prevent publication. The release workflow contains no scanner bypass or `continue-on-error`. The build runs once; packing/publishing uses `--ignore-scripts` to avoid another prepack build or lifecycle execution after qualification.

## Branch versions

The npm-compatible prerelease separator is a hyphen: use **`1.0.1-test.0`**, rather than `1.0.1.test.0`.

| Branch | Current version | Master baseline | Default next version | npm tag |
|---|---|---|---|---|
| master | 0.1.0 (current project seed) | — | **1.0.0** | latest |
| master | 1.0.0 | — | 1.0.1 | latest |
| test | 0.1.0 or 1.0.0 | 1.0.0 | 1.0.1-test.0 | test |
| test | 1.0.1-test.0 | 1.0.0 | 1.0.1-test.1 | test |
| test | 1.0.1-test.3 | 1.0.1 | 1.0.2-test.0 | test |
| master | 1.0.1-test.3 merged from test | — | 1.0.1 | latest |

Versions below 1.0.0 use the initial 1.0.0 floor. Master promotes an incoming `-test.N` version to its stable core; an already stable master version receives a patch bump. Test increments its prerelease counter until master catches up, then starts the next patch candidate. Its baseline comes from the selected version file on `origin/master`, falling back to master's package.json when version.json has not been created. Create/fetch master before releasing test.

Manual dispatch supports `patch`, `minor` or `major`. `minor`/`major` explicitly start the next corresponding stable/candidate line and reset lower fields; the default `patch` uses the branch behavior above. Optional `VERSION_BUMP` changes the default for push releases. Stable SemVer and `-test.N` are accepted; malformed/unsupported versions fail before installation. This workflow updates npm dist-tags, not Git tags.

Examples:

```sh
bash scripts/compute-version.sh 0.1.0 master patch 0.1.0
# 1.0.0
bash scripts/compute-version.sh 1.0.1-test.0 test patch 1.0.0
# 1.0.1-test.1
bash scripts/compute-version.sh 1.0.1-test.3 master patch 1.0.1-test.3
# 1.0.1
```

## Version files

`VERSION_FILE=package.json` is the default. Set the GitHub variable `VERSION_FILE` to `version.json` to use a separate authoritative version file:

```json
{ "version": "1.0.0" }
```

If version.json does not exist, the first run reads the current package version, computes the branch-specific next version and creates version.json. Its additional JSON fields are preserved on subsequent writes.

Every successful release synchronizes:

- `package.json.version`, so the published npm package has the computed version.
- Root `package-lock.json.version` and `packages[""].version`.
- `version.json.version` when selected or already present.
- The local-library reference in `examples/nextjs-demo/package-lock.json`, when present.

Dependency versions are unchanged. Only these files are staged for the version commit. The repository's current version remains the seed until the release workflow computes its first published version.

## GitHub configuration

Add the following under **Settings → Secrets and variables → Actions**. Values shown here are examples, not live connections.

| Kind | Name | Value / purpose |
|---|---|---|
| Variable, required | `SONAR_HOST_URL` | HTTPS SonarQube Server/Cloud URL, e.g. `https://sonar.example.com`. |
| Variable, required | `SONAR_PROJECT_KEY` | Sonar project identifier. |
| Secret, required | `SONAR_TOKEN` | Token authorized to analyze that project. |
| Variable, optional | `SONAR_ORGANIZATION` | Organization key for SonarQube Cloud. |
| Variable, required | `BLACKDUCK_URL` | HTTPS Black Duck SCA URL. |
| Secret, required | `BLACKDUCK_TOKEN` | Black Duck SCA API token. |
| Variable, optional | `BLACKDUCK_PROJECT_NAME` | Defaults to the GitHub repository name; each computed package version becomes a scan version. |
| Variable, optional | `BLACKDUCK_FAILURE_SEVERITIES` | Default `BLOCKER,CRITICAL`. Supports Black Duck policy severities; `NONE` is rejected. |
| Variable, required | `ARTIFACTORY_NPM_REGISTRY` | Complete publishable npm repository endpoint, e.g. `https://packages.example.com/artifactory/api/npm/npm-local/`. |
| Secret, required | `ARTIFACTORY_TOKEN` | Token with registry read, package deploy and dist-tag permissions. |
| Variable, optional | `VERSION_FILE` | `package.json` (default) or `version.json`. |
| Variable, optional | `VERSION_BUMP` | Push-release default: `patch`, `minor`, `major`; default `patch`. |
| Variable, optional | `RELEASE_RUNNER` | Default `ubuntu-latest`; use an appropriate runner label for private network services. |

Put the workflow on master/test, and allow the workflow's `GITHUB_TOKEN` to write the version commit under the repository's branch rules. The runner must reach the configured services and support the pinned actions' Node 24 runtime. Sonar branch analysis must support both master and test; configure a compatible SonarQube edition or Cloud project. No credentials are stored in repository files.

Sonar analyzes `src` and `scripts`, imports library LCOV from `coverage/lcov.info`, and waits up to 600 seconds for the quality gate. Release scripts have a separate Node test harness and are excluded from Sonar coverage calculations. Black Duck uses a synchronous full scan with configurable blocking policy severities. Private dependency installation can be configured independently; the Artifactory publish credential is scoped only to publishing.

The publisher writes a temporary, mode-0600 npm configuration scoped to the exact Artifactory host/repository path. The file contains an environment placeholder, not the secret; npm receives the token through `NODE_AUTH_TOKEN`, and command arguments contain no token. Conflicting package-level publish registry/tag settings are rejected. The temporary configuration is removed on success/failure. Both registry lookup and authentication/network failures stop publication; only an actual E404 means the package version is absent.

## Loop protection and concurrency

The version commit is `chore(release): <version> [skip ci]`, authored by `github-actions[bot]`. It is pushed with the repository's `GITHUB_TOKEN`, which [does not recursively trigger push workflows](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow). The [skip marker](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs) and explicit bot/version-commit guards in both workflows provide additional protection. Human commits that change dependencies/version files still receive ordinary CI; there is no path exclusion hiding package.json edits.

Release jobs are serialized per branch without cancelling an active publication. Queued push runs check the latest branch head and skip if that head is already a bot version commit. A branch that advances during qualification is rejected before publication; its newer push can run against the latest source. Git version pushes are normal fast-forward pushes.

## Partial-failure recovery

Publishing and Git push are separate operations. If the package upload succeeds but its dist-tag or Git metadata push fails, the final summary reports the published artifact and missing metadata commit. Correct the relevant registry/branch permissions and rerun the **unchanged source**: if the exact version already exists with identical SHA-512 integrity, the publisher reuses it and repairs the dist-tag before retrying the version commit.

A changed source tree that computes an already published version produces different artifact integrity and fails. Reconcile the published version in Git before releasing further changes. Registry authentication/outage errors are never treated as permission to overwrite an existing version. If a failed upload has an uncertain result, the summary directs the operator to check Artifactory.

## Local validation

```sh
npm run test:release
npm run test:coverage
npm run lint
npm run typecheck
npm run build
```

Release tests exercise branch versions, first-release floor, promotion, master catch-up, metadata synchronization, bot-run suppression, registry scoping/auth failures, immutable-artifact retries, lost upload responses, secret cleanup and summary outcomes. Publication tests use temporary fixtures and mocked npm calls; they do not contact or publish to a registry.

Workflow YAML was validated with checksum-verified actionlint 1.7.12. Live Sonar, Black Duck, Artifactory and GitHub branch-permission behavior requires the settings above and an actual Actions run.

Vendor references: [Sonar scan action](https://github.com/SonarSource/sonarqube-scan-action), [Black Duck SCA action configuration](https://docs.blackduck.com/r/bridge/latest/bridge-cli-guide/using-the-black-duck-security-scan-action-with-black-duck-sca.html), [Artifactory npm repositories](https://docs.jfrog.com/artifactory/docs/npm-repositories).
