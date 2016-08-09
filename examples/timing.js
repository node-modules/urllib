'use strict';

var https = require('https');
var http = require('http');
var urllib = require('../');
var httpsAgent = new https.Agent({ keepAlive: true });
var agent = new http.Agent({ keepAlive: true });

var url = process.argv[2] || 'https://cnodejs.org';
console.log('timing: %s', url);

var count = 10;

function request(index) {
  if (index === count) {
    return;
  }
  urllib.request(url, {
    data: { wd: 'nodejs' },
    timing: true,
    httpsAgent: httpsAgent,
    agent: agent,
  }, function (err, data, res) {
    console.log('---------------------------');
    console.log('No#%d: %s, keepalive: %s, content size: %d',
      index, res.statusCode, res.keepAliveSocket, data.length);
    console.log(res.timing);
    index++;
    setImmediate(request.bind(null, index));
  });
}

request(0);
