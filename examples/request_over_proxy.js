'use strict';

var urllib = require('..');

var url = process.argv[2] || 'https://api.twitter.com/1.1/help/configuration.json';
console.log('timing: %s', url);

var count = 2;

function request(index) {
  if (index === count) {
    return;
  }
  urllib.request(url, {
    timing: true,
    enableProxy: true,
    proxy: 'http://localhost:8123',
  }, function (err, data, res) {
    if (err) {
      console.log(err);
    }
    console.log('---------------------------');
    console.log('No#%d: %s, keepalive: %s, content size: %d, headers: %j',
      index, res.statusCode, res.keepAliveSocket, data && data.length, res.headers);
    console.log(res.timing);
    // console.log(data && data.toString());
    index++;
    setImmediate(request.bind(null, index));
  });
}

request(0);
