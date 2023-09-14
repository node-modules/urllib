import { execSync } from 'child_process';

function main() {
  if (process.version.startsWith('v14.')) {
    console.log(`ignore build:test on Node.js ${process.version}`);
    return;
  }
  const cwd = process.cwd()
  execSync('npm run build:test', {
    cwd,
    stdio: [ 'inherit', 'inherit', 'inherit' ],
  });
}

main();
