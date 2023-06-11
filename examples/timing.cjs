const urllib = require('..');

const url = process.argv[2] || 'https://cnodejs.org';
console.log('timing: %s', url);

const count = 10000;

async function request(index) {
  if (index === count) {
    return;
  }
  const res = await urllib.request(url, {
    // data: { wd: 'nodejs' },
  });
  console.log('---------------------------');
  console.log('No#%d: %s, content size: %d, requestUrls: %o, socket: %o, rt: %o',
    index, res.statusCode, res.data.length, res.res.requestUrls, res.res.socket, res.res.rt);
  console.log(res.res.timing, res.headers);
  index++;
  setImmediate(request.bind(null, index));
}

request(1);
