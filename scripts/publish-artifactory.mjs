import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { outputs, validateVersion } from './release-version.mjs';

export function registryUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !/\/artifactory\/api\/npm\/[^/]+\/?$/.test(url.pathname)) {
    throw new Error('ARTIFACTORY_NPM_REGISTRY must be an HTTPS Artifactory npm repository URL without credentials or query parameters.');
  }
  url.pathname = `${url.pathname.replace(/\/$/, '')}/`;
  return url;
}
export function validateReleaseTarget(branch, version, tag) {
  validateVersion(version);
  if (branch === 'master' && (!/^\d+\.\d+\.\d+$/.test(version) || tag !== 'latest')) throw new Error('master must publish a stable version to latest.');
  else if (branch === 'test' && (!version.includes('-test.') || tag !== 'test')) throw new Error('test must publish a test prerelease to the test tag.');
  else if (!['master', 'test'].includes(branch)) throw new Error('Refusing to publish outside master/test.');
}
/** Registry probes must distinguish an absent version from authentication/network errors. */
export function parseRegistryResult(result) {
  let value;
  try { value = JSON.parse(result.stdout || '{}'); } catch { throw new Error('Registry returned invalid JSON; publication stopped.'); }
  if (result.status === 0) {
    if (typeof value !== 'string' || !value.startsWith('sha512-')) throw new Error('Published package has no usable SHA-512 integrity; publication stopped.');
    return value;
  }
  if (value.error?.code === 'E404') return null;
  throw new Error(`Registry lookup failed (${value.error?.code || result.error?.code || result.status}); publication stopped.`);
}
export function publicationDecision(existing, integrity) {
  if (existing === null) return 'publish';
  if (existing === integrity) return 'already-published';
  throw new Error('This version exists with different package contents. Refusing to overwrite it; reconcile the released version before retrying.');
}
export function publish({ registry, token, manifest, branch, tag, directory = process.cwd(), run = spawnSync, onPublished = () => {} }) {
  const url = registryUrl(registry);
  if (typeof token !== 'string' || !token.trim() || /[\r\n]/.test(token)) throw new Error('ARTIFACTORY_TOKEN is required and must be a single line.');
  const entries = JSON.parse(readFileSync(manifest, 'utf8'));
  if (!Array.isArray(entries) || entries.length !== 1) throw new Error('Expected one npm pack artifact.');
  const artifact = entries[0];
  validateReleaseTarget(branch, artifact.version, tag);
  if (!/^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(artifact.name) || basename(artifact.filename) !== artifact.filename) throw new Error('Invalid package manifest.');
  const tarball = resolve(directory, artifact.filename);
  if (!existsSync(tarball)) throw new Error('Packed artifact is missing.');
  const integrity = `sha512-${createHash('sha512').update(readFileSync(tarball)).digest('base64')}`;
  if (integrity !== artifact.integrity) throw new Error('Packed artifact integrity changed after the build.');
  const pkg = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'));
  if (pkg.publishConfig?.registry && registryUrl(pkg.publishConfig.registry).href !== url.href) throw new Error('package.json publishConfig.registry conflicts with Artifactory.');
  if (pkg.publishConfig?.tag && pkg.publishConfig.tag !== tag) throw new Error('package.json publishConfig.tag conflicts with the branch tag.');
  const temporary = mkdtempSync(join(tmpdir(), 'mui-table-publish-'));
  try {
    const npmrc = join(temporary, 'npmrc');
    // Scope authentication to this exact registry path. Never place credentials in the workspace or CLI arguments.
    writeFileSync(npmrc, `registry=${url.href}\n//${url.host}${url.pathname}:_authToken=\${NODE_AUTH_TOKEN}\n`, { mode: 0o600 });
    chmodSync(npmrc, 0o600);
    const env = { ...process.env, NPM_CONFIG_USERCONFIG: npmrc, NPM_CONFIG_REGISTRY: url.href,
      NODE_AUTH_TOKEN: token, NPM_CONFIG_FETCH_RETRIES: '2', NPM_CONFIG_FETCH_TIMEOUT: '60000' };
    delete env.ARTIFACTORY_TOKEN;
    const options = { cwd: directory, encoding: 'utf8', env, timeout: 180_000 };
    const lookup = () => parseRegistryResult(run('npm', ['view', `${artifact.name}@${artifact.version}`, 'dist.integrity', '--json', '--registry', url.href], options));
    const decision = publicationDecision(lookup(), integrity);
    if (decision === 'publish') {
      const result = run('npm', ['publish', tarball, '--registry', url.href, '--tag', tag, '--ignore-scripts', '--json'], options);
      // Handle a response lost after a successful upload, but never reinterpret a different package as success.
      if (result.status !== 0 && lookup() !== integrity) throw new Error('npm publish failed; inspect Artifactory before retrying.');
    }
    const publication = { publication: decision === 'publish' ? 'published' : 'already-published', package_name: artifact.name,
      published_version: artifact.version, integrity, registry: url.href, dist_tag: tag };
    // Record the irreversible upload before the dist-tag operation so failure summaries stay accurate.
    onPublished(publication);
    // Also repairs a missing dist-tag when retrying an identical, already published artifact.
    const tagged = run('npm', ['dist-tag', 'add', `${artifact.name}@${artifact.version}`, tag, '--registry', url.href], options);
    if (tagged.status !== 0) throw new Error('Package is published but its dist-tag update failed. Re-run the unchanged source to recover.');
    return publication;
  } finally { rmSync(temporary, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    outputs(publish({ registry: process.env.ARTIFACTORY_NPM_REGISTRY, token: process.env.ARTIFACTORY_TOKEN,
      onPublished: outputs, manifest: process.env.PACK_MANIFEST, branch: process.env.GITHUB_REF_NAME, tag: process.env.RELEASE_DIST_TAG }));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
