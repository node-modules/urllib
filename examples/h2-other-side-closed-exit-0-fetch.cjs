const { fetch, setGlobalDispatcher, Agent } = require('..');

setGlobalDispatcher(
  new Agent({
    allowH2: true,
  }),
);

async function main() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch('https://edgeupdates.microsoft.com/api/products');
      console.log(r.status, r.headers, (await r.text()).length);
    } catch (err) {
      // console.error(err);
      // throw err;
      if (err.code === 'UND_ERR_SOCKET') {
        continue;
      } else {
        throw err;
      }
    }
  }
}

main()
  .then(() => {
    console.log('main end');
  })
  .catch((err) => {
    console.error('main error throw: %s', err);
    // console.error(err);
    process.exit(1);
  });

process.on('beforeExit', (...args) => {
  console.error('beforeExit', args);
});
