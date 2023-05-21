#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

async function main() {
  const root = process.cwd();
  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json')));
  const files = [
    path.join(root, 'src/cjs/HttpClient.js'),
    path.join(root, 'src/esm/HttpClient.js'),
  ];
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    // replace "('node-urllib', 'VERSION')" to "('node-urllib', 'pkg.version')"
    const newContent = content.replace(/\(\'node-urllib\', \'VERSION\'\)/, (match) => {
      const after = `('node-urllib', '${pkg.version}')`;
      console.log('[%s] %s => %s', file, match, after);
      return after;
    });
    if (newContent !== content) {
      await fs.writeFile(file, newContent);
      console.log('Replace version on %s', file);
    }
  }
}

main();
