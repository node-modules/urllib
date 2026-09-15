import { execFileSync } from 'node:child_process';
import { mkdir, rm, symlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const name = process.argv[2];
const fixtures = ['cjs', 'esm', 'mts', 'fixtures/ts', 'fixtures/ts-cjs-es2021', 'fixtures/ts-esm'];
if (!fixtures.includes(name)) {
  throw new Error(`Unknown package fixture: ${name}`);
}
const cwd = join(root, 'test', name);
const modules = join(cwd, 'node_modules');
await mkdir(modules, { recursive: true });
await rm(join(modules, 'urllib'), { recursive: true, force: true });
await symlink(root, join(modules, 'urllib'), 'junction');

const run = (args) => execFileSync(process.execPath, args, { cwd, stdio: 'inherit' });
if (name === 'cjs' || name === 'esm') {
  run(['index.js']);
} else {
  const require = createRequire(import.meta.url);
  const typescript = require('typescript/package.json');
  run([join(dirname(require.resolve('typescript/package.json')), typescript.bin.tsc)]);
  if (name !== 'mts') {
    run(['hello.js']);
  }
}
