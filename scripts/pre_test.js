import { execSync } from 'child_process';

function main() {
  if (!process.version.startsWith('v14.')) {
    return;
  }
  console.log(`use vitest@~0.34.6 on Node.js ${process.version}`);
  const cwd = process.cwd()
  execSync('npm i vitest@~0.34.6 @vitest/coverage-v8', {
    cwd,
    stdio: [ 'inherit', 'inherit', 'inherit' ],
  });
}

main();
