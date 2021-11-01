const { execSync } = require('child_process');

// ignore node < 10, tsd not support them
if (!process.version.startsWith('v8.')) {
  execSync('tsd');
}
