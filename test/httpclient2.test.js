'use strict';

var http = require('http');
var assert = require('assert');
var https = require('https');
var muk = require('muk');
var assert = require('assert');
var config = require('./config');
var mockUrllib = require('../lib/urllib');
var urllib = require('..');
var request = urllib.request;
var HttpClient = urllib.HttpClient2;

describe('test/httpclient2.test.js', function () {
  var client;
  var server;
  before(function() {
    client = new HttpClient();
  });
  before(function(done) {
    server = http.createServer(function(req, res) {
      if (req.url === '/500') {
        res.statusCode = 500;
      }
      if (req.url === '/404') {
        res.statusCode = 404;
      }
      if (req.url === '/body') {
        res.write('{"status": "fail"}');
      }
      res.end();
    });
    server.listen(12345, done);
  });
  after(function(done) {
    server.close(done);
  });
  afterEach(muk.restore);

  it('should request()', function (done) {
    client.request(config.npmWeb + '/package/pedding', {
      timeout: 25000
    }).then(function (result) {
      assert(Buffer.isBuffer(result.data));
      assert(result.status === 200);
      done();
    }).catch(done);
  });

  it('should requestThunk()', function (done) {
    client.requestThunk(config.npmRegistry + '/pedding/*', {
      timeout: 25000,
    })(function (err, result) {
      assert(!err);
      assert(Buffer.isBuffer(result.data));
      assert(result.status === 200);
      done();
    });
  });

  it('should request() with retry fail', function (done) {
    var count = 0;
    muk(mockUrllib, 'request', function(url, args, callback) {
      count++;
      return request(url, args, callback);
    });
    client.request('http://127.0.0.1:12345/500', {
      timeout: 25000,
      retry: 2,
    }).then(function (result) {
      assert(Buffer.isBuffer(result.data));
      assert(result.status === 500);
      assert(count === 3);
      done();
    }).catch(done);
  });

  it('should request() with retry fail after 200ms', function (done) {
    var count = 0;
    muk(mockUrllib, 'request', function(url, args, callback) {
      count++;
      return request(url, args, callback);
    });
    var start = Date.now();
    client.request('http://127.0.0.1:12345/500', {
      timeout: 25000,
      retry: 2,
      retryDelay: 200,
    }).then(function (result) {
      assert(Buffer.isBuffer(result.data));
      assert(result.status === 500);
      assert(count === 3);
      var use = Date.now() - start;
      assert(use > 400);
      done();
    }).catch(done);
  });

  it('should request() with isRetry status', function (done) {
    var count = 0;
    muk(mockUrllib, 'request', function(url, args, callback) {
      count++;
      return request(url, args, callback);
    });
    client.request('http://127.0.0.1:12345/404', {
      timeout: 25000,
      retry: 2,
      isRetry: function(res) {
        return res.status > 400;
      },
    }).then(function (result) {
      assert(Buffer.isBuffer(result.data));
      assert(result.status === 404);
      assert(count === 3);
      done();
    }).catch(done);
  });

  it('should request() with isRetry body', function (done) {
    var count = 0;
    muk(mockUrllib, 'request', function(url, args, callback) {
      count++;
      return request(url, args, callback);
    });
    client.request('http://127.0.0.1:12345/body', {
      timeout: 25000,
      retry: 2,
      isRetry: function(res) {
        var body = JSON.parse(res.data.toString());
        return body.status !== 'success';
      },
    }).then(function (result) {
      assert(Buffer.isBuffer(result.data));
      assert(result.status === 200);
      assert(count === 3);
      done();
    }).catch(done);
  });

  it('should request() with client error', function (done) {
    var count = 0;
    muk(mockUrllib, 'request', function(url, args, callback) {
      count++;
      return request(url, args, callback);
    });
    client.request('http://127.0.0.1:54321', {
      timeout: 25000,
      retry: 2,
      isRetry: function(res) {
        var body = JSON.parse(res.data.toString());
        return body.status !== 'success';
      },
    }).catch(function(err) {
      assert(err);
      assert(err.code === 'ECONNREFUSED');
      assert(count === 3);
      done();
    });
  });

  it('should support keepalive', function(done) {
    var client = new HttpClient({
      httpsAgent: new https.Agent({ keepAlive: true })
    });

    var isKeepAlive = [];
    var url = config.npmWeb + '/package/pedding';
    client.on('response', function(info) {
      isKeepAlive.push(info.res.keepAliveSocket);
    });
    client.request(url, {
      timeout: 25000
    }).then(function() {
      return client.request(url, {
        timeout: 25000
      });
    }).then(function() {
      assert(isKeepAlive.length === 2);
      assert(isKeepAlive[0] === false);
      assert(isKeepAlive[1] === true);
      done();
    }).catch(done);
  });

  describe('when callback throw error', function() {
    var listeners;
    before(function() {
      listeners = process.listeners('uncaughtException');
      process.removeAllListeners('uncaughtException');
    });
    after(function() {
      listeners.forEach(function(listener) {
        process.on('uncaughtException', listener);
      });
    });

    it('should requestThunk()', function (done) {
      process.once('uncaughtException', function(err) {
        assert(err.message === 'callback error');
        done();
      });
      client.requestThunk(config.npmRegistry + '/pedding/*', {
        timeout: 25000,
      })(function () {
        throw new Error('callback error');
      });
    });
  });
});
