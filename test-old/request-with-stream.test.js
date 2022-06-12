'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var pedding = require('pedding');
var urllib = require('..');
var server = require('./fixtures/server');

describe('test/request-with-stream.test.js', function() {
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
    done = pedding(2, done);
    var tmpfile = path.join(__dirname, '.tmp.txt');
    var buf = Buffer.alloc(10 * 1024 * 1024);
    fs.writeFileSync(tmpfile, buf);
    var stream = fs.createReadStream(tmpfile);
    var args = {
      method: 'POST',
      stream: stream,
      timeout: 1000,
    };
    stream.on('close', function() {
      console.log('stream close fired');
      done();
    });
    urllib.request('http://localhost:' + port + '/block', args, function(err, res) {
      assert(err);
      assert(err.name === 'ResponseTimeoutError');
      assert(err.message.indexOf('timeout for 1000ms') > 0);
      assert(!res);
      done();
    });
  });

  it('should close writeStream when request timeout', function(done) {
    done = pedding(2, done);
    var tmpfile = path.join(__dirname, '.tmp.txt');
    var writeStream = fs.createWriteStream(tmpfile);
    var args = {
      method: 'POST',
      writeStream: writeStream,
      timeout: 1000,
    };
    writeStream.on('close', function() {
      console.log('writeStream close fired');
      done();
    });
    urllib.request('http://localhost:' + port + '/response_timeout_10s', args, function(err, res) {
      assert(err);
      assert(err.name === 'ResponseTimeoutError');
      assert(err.message.indexOf('timeout for 1000ms') > 0);
      assert(!res);
      done();
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
      }, 100);
    });
  });
});
