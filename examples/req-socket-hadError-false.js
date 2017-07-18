'use strict';

var http = require('http');

var url = 'http://test.webdav-not-exists-domain.org/auth-digest/user3';
var req = http.get(url);
var count = 0;
req.on('error', function(err) {
  count++;
  console.log('------------------------------------------');
  console.log('req error emit: %s, count: %s', err, count);
  console.log(err);
  console.log(new Error(' ------------ ').stack);
  throw new Error('mock code error');
});

process.on('uncaughtException', function(err) {
  console.log(' -> uncaughtException emit, req.socket._hadError: %s', req.socket._hadError)
});
