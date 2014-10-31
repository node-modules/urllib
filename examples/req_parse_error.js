'use strict';

var zlib = require('zlib');
var http = require('http');
var size = 0;

var options = {
  method: 'GET',
  hostname: 'www.tmall.com',
  port: 80,
  path: '/go/market/promotion-act/shengxian1111_mobile.php',
  headers: {
    // 'Accept-Encoding': 'gzip'
  }
};

http.request(options, function (res) {
  console.log(res.statusCode, res.headers);
  var chunks = [];
  res.on('data', function (data) {
    console.log('data size: %d', data.length);
    size += data.length;
    chunks.push(data);
  }).on('end', function () {
    console.log('response end: gzip %d', size);
    // console.log('response end: gzip %d, realsize: %d', size, zlib.gunzipSync(Buffer.concat(chunks)).length);
  }).on('close', function () {
    console.log('response close: %d', size);
  }).on('error', function (err) {
    console.log(err.stack);
    console.log('response error: %d', size);
  });
}).on('error', function (err) {
  console.log(err.stack);
  console.log('size: %s', size);
}).end();
