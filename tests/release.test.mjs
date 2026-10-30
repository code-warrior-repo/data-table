import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { readVersion, planRelease, validateVersion, writeVersion } from '../scripts/release-version.mjs';
import { parseRegistryResult, publicationDecision, publish, registryUrl, validateReleaseTarget } from '../scripts/publish-artifactory.mjs';
import { releaseSummary } from '../scripts/release-summary.mjs';
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const compute = (...args) => execFileSync('bash', [join(project, 'scripts/compute-version.sh'), ...args], { encoding: 'utf8' }).trim();
const fixture = t => {
  const directory = mkdtempSync(join(tmpdir(), 'table-release-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const json = (file, value) => { mkdirSync(dirname(join(directory, file)), { recursive: true }); writeFileSync(join(directory, file), JSON.stringify(value)); };
  json('package.json', { name: '@company/example', version: '0.1.0', dependencies: { example: '^1.0.0' } });
  json('package-lock.json', { version: '0.1.0', packages: { '': { version: '0.1.0', dependencies: { example: '^1.0.0' } }, 'node_modules/example': { version: '1.0.0' } } });
  json('examples/nextjs-demo/package-lock.json', { packages: { '../..': { version: '0.1.0' }, 'node_modules/next': { version: '16.4.3' } } });
  return { directory, json, read: file => JSON.parse(readFileSync(join(directory, file), 'utf8')) };
};

for (const [current, branch, bump, master, expected] of [
  ['0.1.0', 'master', 'patch', '0.1.0', '1.0.0'],
  ['1.0.0', 'master', 'patch', '1.0.0', '1.0.1'],
  ['1.2.8', 'master', 'minor', '1.2.8', '1.3.0'],
  ['1.2.8', 'master', 'major', '1.2.8', '2.0.0'],
  ['1.0.1-test.4', 'master', 'patch', '1.0.1-test.4', '1.0.1'],
  ['0.1.0', 'test', 'patch', '0.1.0', '1.0.1-test.0'],
  ['1.0.0', 'test', 'patch', '1.0.0', '1.0.1-test.0'],
  ['1.0.1-test.0', 'test', 'patch', '1.0.0', '1.0.1-test.1'],
  ['1.0.1-test.3', 'test', 'patch', '1.0.1', '1.0.2-test.0'],
  ['1.0.1-test.3', 'test', 'patch', '1.1.0', '1.1.1-test.0'],
  ['1.0.1-test.3', 'test', 'minor', '1.0.0', '1.1.0-test.0'],
]) test(`${branch}: ${current} (${bump}, master=${master}) → ${expected}`, () => assert.equal(compute(current, branch, bump, master), expected));

test('rejects invalid versions, unsupported branches and bumps instead of interpreting shell input', () => {
  for (const args of [['1.0.1.test.0', 'test'], ['1.01.0', 'master'], ['1.0.0\ninjected=true', 'master'], ['1.0.0', 'feature'], ['1.0.0', 'master', 'anything'], ['9007199254740991.0.0', 'master', 'major']]) {
    const result = spawnSync('bash', [join(project, 'scripts/compute-version.sh'), ...args], { encoding: 'utf8' });
    assert.notEqual(result.status, 0); assert.equal(result.stdout, '');
  }
  assert.throws(() => validateVersion('9007199254740992.0.0'), /safe integer/);
});
test('synchronizes version metadata and both lock references without changing dependency versions', t => {
  const f = fixture(t);
  assert.equal(readVersion(f.directory, 'version.json'), '0.1.0');
  writeVersion(f.directory, '1.0.1-test.0', 'version.json', '0.1.0');
  assert.equal(f.read('version.json').version, '1.0.1-test.0');
  assert.equal(f.read('package.json').version, '1.0.1-test.0');
  assert.equal(f.read('package-lock.json').version, '1.0.1-test.0');
  assert.equal(f.read('package-lock.json').packages[''].version, '1.0.1-test.0');
  assert.equal(f.read('package-lock.json').packages['node_modules/example'].version, '1.0.0');
  assert.equal(f.read('examples/nextjs-demo/package-lock.json').packages['../..'].version, '1.0.1-test.0');
  assert.throws(() => writeVersion(f.directory, '1.0.1', 'version.json', '0.1.0'), /changed/);
  assert.throws(() => readVersion(f.directory, '../other.json'), /VERSION_FILE/);
});
test('validates all metadata before writes and preserves additional version.json fields', t => {
  const f = fixture(t);
  f.json('version.json', { version: '0.1.0', product: 'example' });
  f.json('package-lock.json', { version: '0.1.0' });
  assert.throws(() => writeVersion(f.directory, '1.0.0', 'version.json'), /package-lock/);
  assert.equal(f.read('package.json').version, '0.1.0');
  f.json('package-lock.json', { packages: { '': { version: '0.1.0' } } });
  writeVersion(f.directory, '1.0.0', 'version.json');
  assert.equal(f.read('version.json').product, 'example');
});
test('planning skips queued automated release commits but permits explicit manual runs', t => {
  const f = fixture(t);
  const git = args => execFileSync('git', args, { cwd: f.directory, stdio: 'pipe' });
  git(['init', '--initial-branch=master']);
  git(['config', 'user.name', 'github-actions[bot]']);
  git(['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
  git(['add', '.']); git(['commit', '-m', 'chore(release): 1.0.0 [skip ci]']);
  assert.equal(planRelease(f.directory, 'master', 'push').required, 'false');
  assert.equal(planRelease(f.directory, 'master', 'workflow_dispatch').required, 'true');
  git(['update-ref', 'refs/remotes/origin/master', 'HEAD']);
  assert.equal(planRelease(f.directory, 'test', 'workflow_dispatch').master_version, '0.1.0');
});
test('limits registry authentication and branch dist-tags to the intended target', () => {
  assert.equal(registryUrl('https://packages.example.test/artifactory/api/npm/npm-local').href, 'https://packages.example.test/artifactory/api/npm/npm-local/');
  for (const url of ['http://packages.example.test/artifactory/api/npm/local/', 'https://secret@packages.example.test/artifactory/api/npm/local/', 'https://registry.npmjs.org/', 'https://packages.example.test/artifactory/api/npm/local/?token=secret']) assert.throws(() => registryUrl(url));
  validateReleaseTarget('master', '1.0.0', 'latest'); validateReleaseTarget('test', '1.0.1-test.0', 'test');
  assert.throws(() => validateReleaseTarget('test', '1.0.1-test.0', 'latest'));
  assert.throws(() => validateReleaseTarget('master', '1.0.1-test.0', 'latest'));
});
test('distinguishes registry absence from auth/network errors and enforces artifact identity', () => {
  assert.equal(parseRegistryResult({ status: 1, stdout: '{"error":{"code":"E404"}}' }), null);
  for (const error of ['E401', 'E403', 'E500', 'ENOTFOUND']) assert.throws(() => parseRegistryResult({ status: 1, stdout: JSON.stringify({ error: { code: error } }) }), /stopped/);
  assert.throws(() => parseRegistryResult({ status: 0, stdout: '{}' }), /integrity/);
  assert.equal(publicationDecision('sha512-same', 'sha512-same'), 'already-published');
  assert.throws(() => publicationDecision('sha512-old', 'sha512-new'), /different package contents/);
});

for (const existing of [null, 'same']) test(`publishes/retries exact tarball and removes temporary credentials (${existing})`, t => {
  const f = fixture(t);
  const content = Buffer.from('packed fixture'), integrity = `sha512-${createHash('sha512').update(content).digest('base64')}`;
  writeFileSync(join(f.directory, 'example.tgz'), content);
  f.json('pack.json', [{ name: '@company/example', version: '1.0.1-test.0', filename: 'example.tgz', integrity }]);
  const calls = []; let configPath;
  const run = (_command, args, options) => {
    configPath = options.env.NPM_CONFIG_USERCONFIG;
    assert.equal(statSync(configPath).mode & 0o777, 0o600);
    assert.match(readFileSync(configPath, 'utf8'), /\/\/packages\.example\.test\/artifactory\/api\/npm\/local\/:_authToken=\$\{NODE_AUTH_TOKEN\}/);
    assert.equal(options.env.ARTIFACTORY_TOKEN, undefined);
    assert.equal(options.env.NODE_AUTH_TOKEN, 'fixture-token');
    assert.ok(!readFileSync(configPath, 'utf8').includes('fixture-token'));
    assert.ok(!args.includes('fixture-token'));
    calls.push(args[0]);
    return args[0] === 'view' ? existing ? { status: 0, stdout: JSON.stringify(integrity) } : { status: 1, stdout: '{"error":{"code":"E404"}}' } : { status: 0, stdout: '{}' };
  };
  const result = publish({ registry: 'https://packages.example.test/artifactory/api/npm/local/', token: 'fixture-token',
    manifest: join(f.directory, 'pack.json'), branch: 'test', tag: 'test', directory: f.directory, run });
  assert.equal(result.publication, existing ? 'already-published' : 'published');
  assert.deepEqual(calls, existing ? ['view', 'dist-tag'] : ['view', 'publish', 'dist-tag']);
  assert.equal(existsSync(configPath), false);
});
test('records an uploaded package before a dist-tag failure and cleans up secrets', t => {
  const f = fixture(t), content = Buffer.from('fixture');
  const integrity = `sha512-${createHash('sha512').update(content).digest('base64')}`;
  writeFileSync(join(f.directory, 'example.tgz'), content);
  f.json('pack.json', [{ name: 'example', version: '1.0.0', filename: 'example.tgz', integrity }]);
  let recorded, configPath;
  assert.throws(() => publish({ registry: 'https://packages.example.test/artifactory/api/npm/local/', token: 'fixture-token',
    manifest: join(f.directory, 'pack.json'), branch: 'master', tag: 'latest', directory: f.directory, onPublished: value => { recorded = value; },
    run: (_command, args, options) => {
      configPath = options.env.NPM_CONFIG_USERCONFIG;
      return args[0] === 'view' ? { status: 1, stdout: '{"error":{"code":"E404"}}' } : { status: args[0] === 'dist-tag' ? 1 : 0 };
    } }), /dist-tag update failed/);
  assert.equal(recorded.publication, 'published'); assert.equal(existsSync(configPath), false);
});
test('summary covers failures, skipped gates, and publication without a Git commit', () => {
  const summary = releaseSummary({ RELEASE_STATUS: 'failure', GITHUB_REF_NAME: 'test', PREVIOUS_VERSION: '1.0.0', NEXT_VERSION: '1.0.1-test.0',
    PUBLICATION: 'published', RELEASE_STEPS: JSON.stringify({ publish: { outcome: 'success' }, commit: { outcome: 'failure' }, sonar: { outcome: 'success' } }) });
  assert.match(summary, /Sonar quality gate \| success/); assert.match(summary, /Black Duck policy gate \| skipped/);
  assert.match(summary, /package is available in Artifactory/); assert.match(summary, /version metadata was not pushed/);
});

test('validates required scanner settings without printing secrets or allowing gate bypass', () => {
  const env = { ...process.env, SONAR_HOST_URL: 'https://sonar.example.test', SONAR_PROJECT_KEY: 'company:table', SONAR_ORGANIZATION: '',
    BLACKDUCK_URL: 'https://blackduck.example.test', BLACKDUCK_FAILURE_SEVERITIES: 'BLOCKER,CRITICAL',
    ARTIFACTORY_NPM_REGISTRY: 'https://packages.example.test/artifactory/api/npm/local/',
    SONAR_TOKEN: 'fixture-sonar-secret', BLACKDUCK_TOKEN: 'fixture-blackduck-secret', ARTIFACTORY_TOKEN: 'fixture-artifactory-secret' };
  const run = overrides => spawnSync(process.execPath, [join(project, 'scripts/check-release-config.mjs')], { env: { ...env, ...overrides }, encoding: 'utf8' });
  const valid = run({}); assert.equal(valid.status, 0);
  assert.ok(!valid.stdout.includes('fixture-'));
  assert.notEqual(run({ BLACKDUCK_FAILURE_SEVERITIES: 'NONE' }).status, 0);
  assert.notEqual(run({ SONAR_TOKEN: '' }).status, 0);
  assert.notEqual(run({ SONAR_PROJECT_KEY: 'project -Dsonar.qualitygate.wait=false' }).status, 0);
});
test('recovers a lost publish response only when the uploaded bytes match', t => {
  const f = fixture(t), content = Buffer.from('fixture'), calls = [];
  const integrity = `sha512-${createHash('sha512').update(content).digest('base64')}`;
  writeFileSync(join(f.directory, 'example.tgz'), content);
  f.json('pack.json', [{ name: 'example', version: '1.0.0', filename: 'example.tgz', integrity }]);
  let queries = 0;
  const result = publish({ registry: 'https://packages.example.test/artifactory/api/npm/local/', token: 'fixture-token',
    manifest: join(f.directory, 'pack.json'), branch: 'master', tag: 'latest', directory: f.directory,
    run: (_command, args) => {
      calls.push(args[0]);
      if (args[0] === 'view') return ++queries === 1 ? { status: 1, stdout: '{"error":{"code":"E404"}}' } : { status: 0, stdout: JSON.stringify(integrity) };
      return { status: args[0] === 'publish' ? 1 : 0 };
    } });
  assert.equal(result.publication, 'published'); assert.deepEqual(calls, ['view', 'publish', 'view', 'dist-tag']);
});
test('does not publish after a failed authenticated registry probe and cleans its credential file', t => {
  const f = fixture(t), content = Buffer.from('fixture'), calls = [];
  const integrity = `sha512-${createHash('sha512').update(content).digest('base64')}`;
  writeFileSync(join(f.directory, 'example.tgz'), content);
  f.json('pack.json', [{ name: 'example', version: '1.0.0', filename: 'example.tgz', integrity }]);
  let configPath;
  assert.throws(() => publish({ registry: 'https://packages.example.test/artifactory/api/npm/local/', token: 'fixture-token',
    manifest: join(f.directory, 'pack.json'), branch: 'master', tag: 'latest', directory: f.directory,
    run: (_command, args, options) => {
      calls.push(args[0]); configPath = options.env.NPM_CONFIG_USERCONFIG;
      return { status: 1, stdout: '{"error":{"code":"E401"}}' };
    } }), /E401/);
  assert.deepEqual(calls, ['view']); assert.equal(existsSync(configPath), false);
  f.json('package.json', { ...f.read('package.json'), publishConfig: { registry: 'https://other.example.test/artifactory/api/npm/local/' } });
  assert.throws(() => publish({ registry: 'https://packages.example.test/artifactory/api/npm/local/', token: 'fixture-token',
    manifest: join(f.directory, 'pack.json'), branch: 'master', tag: 'latest', directory: f.directory,
    run: () => { throw new Error('Must not contact the registry'); } }), /publishConfig.registry conflicts/);
  f.json('package.json', { ...f.read('package.json'), publishConfig: {} });
  writeFileSync(join(f.directory, 'example.tgz'), 'tampered artifact');
  assert.throws(() => publish({ registry: 'https://packages.example.test/artifactory/api/npm/local/', token: 'fixture-token',
    manifest: join(f.directory, 'pack.json'), branch: 'master', tag: 'latest', directory: f.directory,
    run: () => { throw new Error('Must not contact the registry'); } }), /integrity changed/);
});
