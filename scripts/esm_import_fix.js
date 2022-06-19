#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

async function main() {
  const root = path.join(process.cwd(), 'src/esm');
  const files = await fs.readdir(root);
  for (const name of files) {
    if (!name.endsWith('.js')) continue;
    const file = path.join(root, name);
    const content = await fs.readFile(file, 'utf-8');
    // replace "from './HttpClient'" to "from './HttpClient.js'"
    const newContent = content.replaceAll(/ from \'(\.\/[^\.]+)\'/g, (_, p1) => {
      return ` from '${p1}.js'`;
    });
    if (newContent !== content) {
      await fs.writeFile(file, newContent);
      console.log('ESM import fix on %s', file);
    }
  }
}

main();
