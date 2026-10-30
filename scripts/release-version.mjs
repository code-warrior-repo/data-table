import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateVersion(version) {
  if (typeof version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-test\.(0|[1-9]\d*))?$/.test(version)) {
    throw new Error('Version must be X.Y.Z or X.Y.Z-test.N.');
  }
  if (version.split(/[.\-]/).filter(part => /^\d+$/.test(part)).some(part => !Number.isSafeInteger(Number(part)))) throw new Error('Version number exceeds the safe integer range.');
  return version;
}
export function validateVersionFile(file) {
  if (!['package.json', 'version.json'].includes(file)) throw new Error('VERSION_FILE must be package.json or version.json.');
  return file;
}
const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
export function readVersion(directory, file = 'package.json') {
  validateVersionFile(file);
  const source = file === 'version.json' && existsSync(resolve(directory, file)) ? file : 'package.json';
  return validateVersion(readJson(resolve(directory, source)).version);
}
export function readMasterVersion(directory, file = 'package.json') {
  validateVersionFile(file);
  for (const source of [...new Set([file, 'package.json'])]) {
    let content;
    try {
      content = execFileSync('git', ['show', `refs/remotes/origin/master:${source}`], { cwd: directory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      if (source === 'package.json') throw new Error('Cannot read origin/master version. Fetch/create master before releasing test.', { cause: error });
      continue;
    }
    return validateVersion(JSON.parse(content).version);
  }
}
/** Prepare every metadata edit before writing; never run npm lifecycle scripts or change dependencies. */
export function writeVersion(directory, next, file = 'package.json', expected) {
  validateVersion(next); validateVersionFile(file);
  if (expected !== undefined && readVersion(directory, file) !== expected) throw new Error('Current version changed after release planning.');
  const metadata = new Map();
  const pkg = readJson(resolve(directory, 'package.json'));
  pkg.version = next; metadata.set('package.json', pkg);
  const lock = readJson(resolve(directory, 'package-lock.json'));
  if (!lock.packages?.['']) throw new Error('Expected a package-lock v2/v3 root package.');
  lock.version = next; lock.packages[''].version = next; metadata.set('package-lock.json', lock);
  if (file === 'version.json' || existsSync(resolve(directory, 'version.json'))) {
    const version = existsSync(resolve(directory, 'version.json')) ? readJson(resolve(directory, 'version.json')) : {};
    metadata.set('version.json', { ...version, version: next });
  }
  const exampleLock = 'examples/nextjs-demo/package-lock.json';
  if (existsSync(resolve(directory, exampleLock))) {
    const demo = readJson(resolve(directory, exampleLock));
    if (demo.packages?.['../..']) { demo.packages['../..'].version = next; metadata.set(exampleLock, demo); }
  }
  for (const [name, content] of metadata) writeFileSync(resolve(directory, name), `${JSON.stringify(content, null, 2)}\n`);
  return [...metadata.keys()];
}
export function outputs(values) {
  const content = Object.entries(values).map(([key, value]) => {
    if (/[\r\n]/.test(String(value))) throw new Error(`Invalid multiline output: ${key}`);
    return `${key}=${value}\n`;
  }).join('');
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, content);
  else process.stdout.write(content);
}
export function planRelease(directory, branch, event, file = 'package.json') {
  if (!['master', 'test'].includes(branch)) throw new Error('Release branch must be master or test.');
  const git = args => execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trim();
  const subject = git(['log', '-1', '--format=%s']);
  const email = git(['log', '-1', '--format=%ae']);
  const skip = event === 'push' && subject.startsWith('chore(release): ') && email === '41898282+github-actions[bot]@users.noreply.github.com';
  return { required: String(!skip), current_version: readVersion(directory, file), version_file: validateVersionFile(file),
    master_version: branch === 'master' ? readVersion(directory, file) : readMasterVersion(directory, file),
    source_sha: git(['rev-parse', 'HEAD']), package_name: readJson(resolve(directory, 'package.json')).name,
    dist_tag: branch === 'master' ? 'latest' : 'test' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [command, ...args] = process.argv.slice(2);
    if (command === 'plan') outputs(planRelease(process.cwd(), ...args));
    else if (command === 'write') outputs({ files: writeVersion(process.cwd(), ...args).join(', ') });
    else throw new Error('Usage: release-version.mjs plan BRANCH EVENT [FILE] | write NEXT [FILE] [EXPECTED]');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
