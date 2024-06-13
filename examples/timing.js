'use strict';

var assert = require('assert');
var https = require('https');
var http = require('http');
var urllib = require('../');
var httpsAgent = new https.Agent({ keepAlive: true });
var agent = new http.Agent({ keepAlive: true });

var url = process.argv[2] || 'https://cnodejs.org';
console.log('timing: %s', url);

var count = 1;

function request(index) {
  if (index === count) {
    return;
  }
  urllib.request(url, {
    // data: { wd: 'nodejs' },
    timing: true,
    // httpsAgent: httpsAgent,
    // agent: agent,
    method: 'POST',
  }, function (err, data, res) {
    if (err) {
      console.log(err);
      console.log(res);
      throw err;
    }
    console.log('---------------------------');
    console.log('No#%d: %s, keepalive: %s, content size: %d, %s, %s',
      index, res.statusCode, res.keepAliveSocket, data.length, res.socketHandledRequests, res.socketHandledResponses);
    console.log(res.timing, res.headers);
    index++;
    setImmediate(request.bind(null, index));
  });
}

request(0);
