#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const root = process.cwd();
  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json')));
  const files = [
    path.join(root, 'dist/commonjs/HttpClient.js'),
    path.join(root, 'dist/esm/HttpClient.js'),
  ];
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    // replace "const VERSION = 'VERSION';" to "const VERSION = '4.0.0';"
    const newContent = content.replace(/const VERSION = 'VERSION';/, match => {
      const after = `const VERSION = '${pkg.version}';`;
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
