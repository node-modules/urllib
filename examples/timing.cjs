const { HttpClient } = require('..');

const httpClient = new HttpClient({
  connect: {
    timeout: 1500,
  },
});
const url = process.argv[2] || 'https://cnodejs.org';
console.log('timing: %s', url);

const count = 5;

async function request(index) {
  if (index === count) {
    return;
  }
  const res = await httpClient.request(url + '?index=' + index, {
    // data: { wd: 'nodejs' },
    dataType: 'json',
  });
  console.log('---------------------------');
  console.log('No#%d: %s, content size: %d, requestUrls: %o, socket: %o, rt: %o',
    index, res.statusCode, res.data.length, res.res.requestUrls, res.res.socket, res.res.rt);
  console.log(res.res.timing);
  // console.log(res.res.timing, res.headers);
  // console.log(res.data);
  index++;
  setImmediate(request.bind(null, index));
}

request(0);
