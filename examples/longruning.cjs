const { HttpClient } = require('..');

const httpClient = new HttpClient({
  allowH2: true,
});

async function main() {
  for (let i = 0; i < 1000000; i++) {
    // await httpClient.request('https://registry.npmmirror.com/');
    // console.log(r.status, r.headers, r.res.timing);
    try {
      const r = await httpClient.request('https://edgeupdates.microsoft.com/api/products');
      // console.log(r.status, r.headers, r.data.length, r.res.timing);
      if (i % 10 === 0) {
        // console.log(r.status, r.headers, r.data.length, r.res.timing);
        console.log(i, r.status, process.memoryUsage());
      }
    } catch (err) {
      console.error('%s error: %s', i, err.message);
    }
  }
}

main().then(() => {
  console.log('main end');
}).catch(err => {
  console.error('main error throw: %s', err);
  console.error(err);
  process.exit(1);
});

// process.on('uncaughtException', (...args) => {
//   console.error('uncaughtException', args);
//   process.exit(1);
// });

// process.on('unhandledRejection', (...args) => {
//   console.error('unhandledRejection', args);
//   process.exit(2);
// });

// process.on('uncaughtExceptionMonitor', (...args) => {
//   console.error('uncaughtExceptionMonitor', args);
//   process.exit(2);
// });

process.on('beforeExit', (...args) => {
  console.error('beforeExit', args);
});
