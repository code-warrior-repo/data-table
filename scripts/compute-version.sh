#!/usr/bin/env bash
# Usage: bash scripts/compute-version.sh CURRENT_VERSION BRANCH [patch|minor|major] [MASTER_VERSION]
# Pure calculation: no npm install, Git writes, tags, timestamps or network requests.
set -euo pipefail
node --input-type=module - "$@" <<'NODE'
const [current, branch, bump = 'patch', master = current] = process.argv.slice(2);
function parse(value) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-test\.(0|[1-9]\d*))?$/.exec(value ?? '');
  if (!match) throw new Error('Version must be X.Y.Z or X.Y.Z-test.N.');
  const numbers = match.slice(1).map(part => part === undefined ? undefined : Number(part));
  if (numbers.some(number => number !== undefined && !Number.isSafeInteger(number))) throw new Error('Version number exceeds the safe integer range.');
  return { base: numbers.slice(0, 3), counter: numbers[3] };
}
const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const maximum = (a, b) => compare(a, b) >= 0 ? a : b;
function increment(base) {
  const index = { major: 0, minor: 1, patch: 2 }[bump];
  const next = base.map((part, position) => position < index ? part : position === index ? part + 1 : 0);
  if (!next.every(Number.isSafeInteger)) throw new Error('Next version exceeds the safe integer range.');
  return next;
}
try {
  if (!['master', 'test'].includes(branch)) throw new Error('Release branch must be master or test.');
  if (!['major', 'minor', 'patch'].includes(bump)) throw new Error('Bump must be major, minor or patch.');
  const previous = parse(current);
  const minimum = [1, 0, 0];
  let next;
  if (branch === 'master') {
    next = compare(previous.base, minimum) < 0 ? minimum
      : previous.counter !== undefined && bump === 'patch' ? previous.base : increment(previous.base);
    console.log(next.join('.'));
  } else {
    const baseline = maximum(parse(master).base, minimum);
    if (previous.counter !== undefined && compare(previous.base, baseline) > 0 && bump === 'patch') {
      if (!Number.isSafeInteger(previous.counter + 1)) throw new Error('Prerelease counter exceeds the safe integer range.');
      console.log(`${previous.base.join('.')}-test.${previous.counter + 1}`);
    } else {
      next = increment(maximum(previous.base, baseline));
      console.log(`${next.join('.')}-test.0`);
    }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
NODE
