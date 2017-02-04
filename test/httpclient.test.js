'use strict';

var pedding = require('pedding');
var should = require('should');
var assert = require('assert');
var config = require('./config');
var urllib = require('../');

describe('test/httpclient.test.js', function () {
  it('should request without args work', function (done) {
    var client = urllib.create();
    client.request(config.npmRegistry + '/pedding/*', {
      timeout: 25000,
    }, function (err, data, res) {
      should.not.exist(err);
      data.should.be.a.Buffer;
      res.status.should.equal(200);
      done();
    });
  });

  it('should requestThunk()', function (done) {
    done = pedding(2, done);
    var client = urllib.create({
      agent: urllib.agent,
      httpsAgent: urllib.httpsAgent,
    });
    client.hasCustomAgent.should.equal(true);
    client.hasCustomHttpsAgent.should.equal(true);
    client.requestThunk(config.npmRegistry + '/pedding/*', {
      timeout: 25000,
    })(function (err, result) {
      should.not.exist(err);
      result.data.should.be.a.Buffer;
      result.status.should.equal(200);
      done();
    });

    client.requestThunk(config.npmRegistry + '/pedding/*', {
      timeout: 25000,
    })(function (err, result) {
      should.not.exist(err);
      result.data.should.be.a.Buffer;
      result.status.should.equal(200);
      done();
    });
  });

  it('should curl() with callback', function (done) {
    var client = urllib.create();
    client.hasCustomAgent.should.equal(false);
    client.hasCustomHttpsAgent.should.equal(false);
    client.curl(config.npmRegistry + '/pedding/*', {
      timeout: 25000
    }, function (err, result, res) {
      should.not.exist(err);
      result.should.be.a.Buffer;
      res.status.should.equal(200);
      done();
    });
  });

  it('should curl() with promise', function (done) {
    var client = urllib.create();
    client.hasCustomAgent.should.equal(false);
    client.hasCustomHttpsAgent.should.equal(false);
    client.curl(config.npmWeb + '/package/pedding', {
      timeout: 25000
    }).then(function (result) {
      should.ok(Buffer.isBuffer(result.data));
      result.status.should.equal(200);
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
    client.request(config.npmRegistry + '/pedding/*', {
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
      info.ctx.should.eql({
        foo: 'bar',
      });
      done();
    });
    client.request(config.npmRegistry + '/pedding/*', {
      timeout: 25000,
      ctx: {
        foo: 'bar',
      },
      headers: {
        connection: 'close',
      },
    }, function (err, data, res) {
      should.not.exist(err);
      data.should.be.a.Buffer;
      res.status.should.equal(200);
      done();
    });
    client.on('response', function(info) {
      info.res.remoteAddress.should.be.a.String();
      info.res.remotePort.should.be.a.Number();
      done();
    });
  });
});
