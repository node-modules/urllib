'use strict';

var pedding = require('pedding');
var assert = require('assert');
var config = require('./config');
var urllib = require('../');

describe('test/httpclient.test.js', function () {
  it('should request without args work', function (done) {
    var client = urllib.create();
    client.request(config.npmRegistry + '/pedding/latest', {
      timeout: 25000,
    }, function (err, data, res) {
      assert(!err);
      assert(Buffer.isBuffer(data));
      assert(res.statusCode === 200);
      done();
    });
  });

  it('should create HttpClient with defaultArgs', function(done) {
    var client = new urllib.HttpClient({
      defaultArgs: {
        timeout: 1,
      },
    });
    done = pedding(2, done);
    client.request(config.npmRegistry + '/pedding/latest', function(err) {
      assert(err);
      assert(err.name === 'ConnectionTimeoutError');
      assert(err.message.indexOf('Connect timeout for 1ms') > -1);

      client.request(config.npmRegistry + '/pedding/latest', {
        dataType: 'json',
        timeout: 25000,
      }, function(err, data, res) {
        assert(!err);
        assert(data.name === 'pedding');
        assert(res.statusCode === 200);
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

  it('should requestThunk()', function (done) {
    done = pedding(2, done);
    var client = urllib.create({
      agent: urllib.agent,
      httpsAgent: urllib.httpsAgent,
    });
    assert(client.hasCustomAgent === true);
    assert(client.hasCustomHttpsAgent === true);
    client.requestThunk(config.npmRegistry + '/pedding/latest', {
      timeout: 25000,
    })(function (err, result) {
      assert(!err);
      assert(Buffer.isBuffer(result.data));
      assert(result.status === 200);
      done();
    });

    client.requestThunk(config.npmRegistry + '/pedding/latest', {
      timeout: 25000,
    })(function (err, result) {
      assert(!err);
      assert(Buffer.isBuffer(result.data));
      assert(result.status === 200);
      done();
    });
  });

  it('should curl() with callback', function (done) {
    var client = urllib.create();
    assert(client.hasCustomAgent === false);
    assert(client.hasCustomHttpsAgent === false);
    client.curl(config.npmRegistry + '/pedding/latest', {
      timeout: 25000
    }, function (err, result, res) {
      assert(!err);
      assert(res.statusCode === 200);
      done();
    });
  });

  it('should curl() with promise', function (done) {
    var client = urllib.create();
    assert(client.hasCustomAgent === false);
    assert(client.hasCustomHttpsAgent === false);
    client.curl(config.npmWeb + '/package/pedding', {
      timeout: 25000
    }).then(function (result) {
      assert(Buffer.isBuffer(result.data));
      assert(result.status === 200);
      done();
    }).catch(done);
  });

  it('should emit request, response event with ctx', function(done) {
    done = pedding(3, done);
    var client = urllib.create();
    var reqMeta;
    client.on('request', function(req) {
      assert.deepEqual(req.ctx, {
        foo: 'bar',
      });
      reqMeta = req;
      reqMeta.starttime = Date.now();
      done();
    });
    client.request(config.npmRegistry + '/pedding/latest', {
      timeout: 25000,
      ctx: {
        foo: 'bar',
      }
    }, function(err, data, res) {
      assert(!err);
      assert(Buffer.isBuffer(data));
      assert(res.status === 200);
      done();
    });
    client.on('response', function(res) {
      assert(typeof res.req.socket.remoteAddress === 'string');
      assert(typeof res.req.socket.remotePort === 'number');
      // should be the same object
      assert(reqMeta === res.req);
      assert(typeof res.req.starttime === 'number');
      done();
    });
  });

  it('should get remoteAddress from response event on non-keepalive connection', function (done) {
    done = pedding(3, done);
    var client = urllib.create();
    client.on('request', function(info) {
      assert.deepEqual(info.ctx, {
        foo: 'bar',
      });
      done();
    });
    client.request(config.npmRegistry + '/pedding/latest', {
      timeout: 25000,
      ctx: {
        foo: 'bar',
      },
      headers: {
        connection: 'close',
      },
    }, function (err, data, res) {
      assert(!err);
      assert(Buffer.isBuffer(data));
      assert(res.statusCode === 200);
      done();
    });
    client.on('response', function(info) {
      assert(typeof info.res.remoteAddress === 'string');
      assert(typeof info.res.remotePort === 'number');
      done();
    });
  });
});
