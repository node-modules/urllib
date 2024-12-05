const { HttpClient } = require('..');

const httpClient = new HttpClient({
  connect: {
    timeout: 1500,
  },
});
const url = process.argv[2] || 'https://npmmirror.com/';
console.log('timing: %s', url);

async function request() {
  let res = await httpClient.request(url, {
    followRedirect: false,
  });
  console.log('---------------------------');
  console.log('GET %s, content size: %d, requestUrls: %o, socket: %o, rt: %o',
    res.statusCode, res.data.length, res.res.requestUrls, res.res.socket, res.res.rt);
  console.log(res.res.timing);

  res = await httpClient.request(url, {
    followRedirect: false,
  });
  console.log('---------------------------');
  console.log('GET %s, content size: %d, requestUrls: %o, socket: %o, rt: %o',
    res.statusCode, res.data.length, res.res.requestUrls, res.res.socket, res.res.rt);
  console.log(res.res.timing);
}

request();
