/**!
 * node-modules - test/redirect.js
 *
 * Copyright(c) fengmk2 and other contributors.
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

urllib.request('http://test.webdav.org/redir-tmp/', {
  followRedirect: true,
  writeStream: fs.createWriteStream(path.join(__dirname, '.tmp.txt')),
}, function (err, _, res) {
  if (err) {
    throw err;
  }
  process.stdout.write('' + res.statusCode);
});
