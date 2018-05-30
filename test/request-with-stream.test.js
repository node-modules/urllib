'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var urllib = require('..');
var server = require('./fixtures/server');

describe('request-with-stream.test.js', function() {
  var isNode012 = /^v0\.12\.\d+$/.test(process.version);
  if (isNode012) {
    return;
  }

  var app;
  var port;
  before(function (done) {
    app = server.listen(0, function () {
      port = app.address().port;
      done();
    });
  });
  after(function() {
    app.close();
  });

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
    urllib.request('http://localhost:' + port + '/block', args, function(err, res) {
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

  it('should close writeStream when request timeout', function(done) {
    var tmpfile = path.join(__dirname, '.tmp.txt');
    var writeStream = fs.createWriteStream(tmpfile);
    var args = {
      method: 'POST',
      writeStream: writeStream,
      timeout: 1000,
    };
    var streamClosed = false;
    writeStream.on('close', function() {
      streamClosed = true;
      console.log('writeStream close fired');
    });
    urllib.request('http://localhost:' + port + '/response_timeout_10s', args, function(err, res) {
      assert(err);
      assert(err.name === 'ResponseTimeoutError');
      assert(err.message.indexOf('timeout for 1000ms') > 0);
      assert(!res);
      setTimeout(function() {
        assert(streamClosed);
        done();
      }, 100);
    });
  });

  it('should handle writeStream when writeStream emit error', function(done) {
    var tmpfile = path.join(__dirname, '.tmpnotexists/.tmp.txt.notexists');
    var writeStream = fs.createWriteStream(tmpfile);
    var args = {
      method: 'POST',
      writeStream: writeStream,
      timeout: 1000,
    };
    var streamError = false;
    writeStream.on('error', function(err) {
      streamError = true;
      console.log('writeStream error fired: %s', err);
    });
    urllib.request('http://localhost:' + port + '/response_timeout_10s', args, function(err, res) {
      assert(err);
      assert(err.name === 'Error');
      assert(err.code === 'ENOENT');
      assert(err.message.indexOf('ENOENT: no such file or directory, open') === 0);
      assert(!res);
      setTimeout(function() {
        assert(streamError);
        done();
      }, 1);
    });
  });
});
