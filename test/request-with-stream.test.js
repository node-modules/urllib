'use strict';

var assert = require('assert');
var urllib = require('..');
var fs = require('fs');
var path = require('path');

describe.only('request-with-stream.test.js', function() {
  it('should close stream when request timeout', function(done) {
    var tmpfile = path.join(__dirname, '.tmp.txt');
    var buf = Buffer.alloc && Buffer.alloc(10 * 1024 * 1024) || new Buffer(10 * 1024 * 1024);
    fs.writeFileSync(tmpfile, buf);
    var stream = fs.createReadStream(tmpfile);
    var args = {
      method: 'POST',
      stream: stream,
      timeout: 1000,
    };
    var streamClosed = false;
    stream.on('close', function() {
      streamClosed = true;
      console.log('stream close fired');
    });
    urllib.request('https://httpbin.org/delay/10', args, function(err, res) {
      assert(err);
      assert(err.name === 'ResponseTimeoutError');
      assert(err.message.indexOf('timeout for 1000ms') > 0);
      assert(!res);
      setTimeout(function() {
        assert(streamClosed);
        done();
      }, 0);
    });
  });
});
