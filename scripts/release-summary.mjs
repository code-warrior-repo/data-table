import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const cell = value => String(value || '—').replace(/[|\r\n`<>]/g, ' ');
export function releaseSummary(env) {
  let steps;
  try { steps = JSON.parse(env.RELEASE_STEPS || '{}'); } catch { steps = {}; }
  const rows = [['Checkout', 'checkout'], ['Set up Node', 'node'], ['Read version / branch', 'plan'], ['Compute version', 'version'],
    ['Write version metadata', 'metadata'], ['Validate configuration', 'config'], ['npm ci', 'install'],
    ['Tests / coverage / declarations', 'tests'], ['Lint', 'lint'], ['Sonar quality gate', 'sonar'], ['Black Duck policy gate', 'blackduck'],
    ['Build / pack', 'build'], ['Check branch freshness', 'freshness'], ['Artifactory publish', 'publish'], ['Push version metadata', 'commit']];
  const published = ['published', 'already-published'].includes(env.PUBLICATION);
  const warning = published && steps.commit?.outcome !== 'success'
    ? '\n**The package is available in Artifactory, but version metadata was not pushed.** Re-run only if the source is unchanged; identical artifact integrity allows recovery. If the branch advanced, reconcile the published version in Git before the next release.\n' : '';
  const skipped = steps.plan?.outputs?.required === 'false' ? '\nNo release was needed: the latest source is already an automated version commit.\n' : '';
  return `## Release summary\n\n` +
    `| Item | Value |\n|---|---|\n| Result | ${cell(env.RELEASE_STATUS)} |\n| Package | ${cell(env.RELEASE_PACKAGE)} |\n| Branch | ${cell(env.GITHUB_REF_NAME)} |\n| Version | ${cell(env.PREVIOUS_VERSION)} → ${cell(env.NEXT_VERSION)} |\n| Metadata source | ${cell(env.VERSION_FILE)} |\n| Updated files | ${cell(env.VERSION_FILES)} |\n| Registry | ${cell(env.RELEASE_REGISTRY)} |\n| npm tag | ${cell(env.RELEASE_DIST_TAG)} |\n| Source commit | ${cell(env.RELEASE_SOURCE_SHA)} |\n| Version commit | ${cell(env.VERSION_COMMIT)} |\n| Publication | ${cell(env.PUBLICATION || (steps.publish?.outcome === 'failure' ? 'failed or uncertain; inspect Artifactory' : 'not published'))} |\n| Integrity | ${cell(env.RELEASE_INTEGRITY)} |\n\n` +
    `| Step | Outcome |\n|---|---|\n${rows.map(([label, id]) => `| ${label} | ${cell(steps[id]?.outcome || 'skipped')} |`).join('\n')}\n` + warning + skipped;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const summary = releaseSummary(process.env);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  else process.stdout.write(summary);
}
