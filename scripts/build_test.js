import { spawnSync } from 'child_process';

async function main() {
  if (process.version.startsWith('v14.')) {
    console.log(`ignore build:test on Node.js ${process.version}`);
    return;
  }
  const cwd = process.cwd()
  spawnSync('npm run build:test', {
    cwd,
  });
}

main();
