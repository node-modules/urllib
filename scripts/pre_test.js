import { execSync } from 'child_process';

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
}

main();
