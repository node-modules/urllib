import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function main() {
  if (!process.version.startsWith('v14.')) {
    return;
  }
  console.log(`use vitest@^0.33.0 on Node.js ${process.version}`);
  const cwd = process.cwd()
  execSync('npm i vitest@^0.33.0 @vitest/coverage-v8@^0.33.0', {
    cwd,
    stdio: [ 'inherit', 'inherit', 'inherit' ],
  });
  if (process.env.CI) {
    // add --no-file-parallelism
    const pkgFile = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgFile, 'utf-8'));
    pkg.scripts.cov = `${pkg.scripts.cov} --no-file-parallelism`;
    writeFileSync(pkgFile, JSON.stringify(pkg));
  }
}

main();
