import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
const folder = mkdtempSync(join(tmpdir(), 'data-table-package-'));
execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', folder], { stdio: 'pipe' });
const tarball = join(folder, readdirSync(folder).find(file => file.endsWith('.tgz')));
writeFileSync(join(folder, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
execFileSync('npm', ['install', '--prefix', folder, '--ignore-scripts', '--no-audit', '--no-fund', tarball, '@types/react@19'], { stdio: 'pipe' });
const packageFolder = join(folder, 'node_modules/@company/mui-data-table');
const pkg = JSON.parse(readFileSync(join(packageFolder, 'package.json')));
for (const entry of Object.values(pkg.exports)) {
  assert.ok(readFileSync(join(packageFolder, entry.types)).length);
  assert.ok(readFileSync(join(packageFolder, entry.import)).length);
}
for (const entry of ['core', 'spring', 'exports']) {
  const text = readFileSync(join(packageFolder, 'dist', `${entry}.js`), 'utf8');
  assert.ok(!/^['"]use client['"]/m.test(text));
  await import(join(packageFolder, 'dist', `${entry}.js`));
}
assert.match(readFileSync(join(packageFolder, 'dist/index.js'), 'utf8'), /^['"]use client['"]/);
writeFileSync(join(folder, 'consumer.tsx'), readFileSync('tests/types/consumer.tsx'));
execFileSync(resolve('node_modules/.bin/tsc'), ['--noEmit', '--strict', '--jsx', 'react-jsx', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'consumer.tsx'], { cwd: folder, stdio: 'pipe' });
console.log('Fresh consumer, packed declarations, client boundary and pure entry imports verified.');
