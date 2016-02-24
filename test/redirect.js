/**
 * Copyright(c) node-modules and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var urllib = require('../');
var fs = require('fs');
var path = require('path');
var http = require('http');

var server = http.createServer(function(req, res) {
  req.resume();
  req.on('end', function() {
    if (req.url === '/redirect') {
      res.statusCode = 302;
      res.setHeader('Location', '/404');
      res.end('');
    } else {
      res.statusCode = 404;
      res.end('not found');
    }
  });
});

server.listen(0, function() {
  var address = server.address();
  urllib.request('http://localhost:' + address.port + '/redirect', {
    followRedirect: true,
    writeStream: fs.createWriteStream(path.join(__dirname, '.tmp.txt')),
    timeout: 20000
  }, function (err, _, res) {
    if (err) {
      throw err;
    }
    process.stdout.write('' + res.statusCode);
    process.exit(0);
  });
});
