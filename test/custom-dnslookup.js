'use strict';

const https = require('https');
const dns = require('dns');

var req = https.request({
  protocol: 'https:',
  host: 'r.cnpmjs.org',
  lookup: function foo(host, dnsopts, callback) {
    setTimeout(function() {
      console.log('dns lookup https host: %s', host);
      dns.lookup(host, dnsopts, callback);
    }, 1000);
  },
});

req.on('response', function(response) {
  console.log('response status: %s, headers: %j', response.statusCode, response.headers);
  response.resume();
});

req.end();
