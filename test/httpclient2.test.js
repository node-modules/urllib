'use strict';

var pedding = require('pedding');
var http = require('http');
var assert = require('assert');
var muk = require('muk');
var assert = require('assert');
var KeepAliveAgent = require('agentkeepalive');
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
    client.requestThunk(config.npmRegistry + '/pedding/latest', {
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
      httpsAgent: new KeepAliveAgent.HttpsAgent({ keepAlive: true }),
      agent: new KeepAliveAgent({ keepAlive: true }),
    });

    var isKeepAlive = [];
    var url = config.npmRegistry + '/pedding/latest';
    client.on('response', function(info) {
      isKeepAlive.push(info.res.keepAliveSocket);
    });
    client.request(url, {
      timeout: 25000,
    }).then(function() {
      // console.log(result.headers);
      // sleep a while to make sure socket release to free queue
      return sleep(1);
    }).then(function() {
      return client.request(url, {
        timeout: 25000,
      });
    }).then(function() {
      // console.log(result.headers);
      assert(isKeepAlive.length === 2);
      assert(isKeepAlive[0] === false);
      assert(isKeepAlive[1] === true);
      done();
    }).catch(done);
  });

  it('should create HttpClient2 with defaultArgs', function(done) {
    var client = new urllib.HttpClient2({
      defaultArgs: {
        timeout: 1,
      },
    });
    done = pedding(2, done);
    client.request(config.npmRegistry + '/pedding/latest').catch(function(err) {
      assert(err);
      assert(err.name === 'ConnectionTimeoutError');
      assert(err.message.indexOf('Connect timeout for 1ms') > -1);

      client.request(config.npmRegistry + '/pedding/latest', {
        dataType: 'json',
        timeout: 25000,
      }).then(function(result) {
        assert(result.data.name === 'pedding');
        assert(result.res.statusCode === 200);
        done();
      });
    });

    // requestThunk()
    client.requestThunk(config.npmRegistry + '/pedding/latest')(function(err) {
      assert(err);
      assert(err.name === 'ConnectionTimeoutError');
      assert(err.message.indexOf('Connect timeout for 1ms') > -1);

      client.requestThunk(config.npmRegistry + '/pedding/latest', {
        dataType: 'json',
        timeout: 25000,
      })(function(err, result) {
        assert(!err);
        assert(result.data.name === 'pedding');
        assert(result.res.statusCode === 200);
        done();
      });
    });
  });

  describe('when callback throw error', function() {
    var listeners;
    before(function() {
      listeners = process.listeners('uncaughtException');
      process.removeAllListeners('uncaughtException');
    });
    after(function() {
      process.removeAllListeners('uncaughtException');
      listeners.forEach(function(listener) {
        process.on('uncaughtException', listener);
      });
    });

    it('should requestThunk()', function(done) {
      process.once('uncaughtException', function() {
        throw new Error('should not fire uncaughtException');
      });
      client.requestThunk(config.npmRegistry + '/pedding/latest', {
        timeout: 10000,
      })(function() {
        setTimeout(done, 500);
        throw new Error('mock callback error');
      });
    });
  });
});

var _Promise;
function sleep(ms) {
  if (!_Promise) {
    _Promise = require('any-promise');
  }

  return new _Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}
