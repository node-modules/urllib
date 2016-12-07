'use strict';

var http = require('http');
var should = require('should');
var muk = require('muk');
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
      should.ok(Buffer.isBuffer(result.data));
      result.status.should.equal(200);
      done();
    }).catch(done);
  });

  it('should requestThunk()', function (done) {
    client.requestThunk(config.npmRegistry + '/pedding/*', {
      timeout: 25000,
    })(function (err, result) {
      should.not.exist(err);
      result.data.should.be.a.Buffer;
      result.status.should.equal(200);
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
      should.ok(Buffer.isBuffer(result.data));
      result.status.should.equal(500);
      count.should.equal(3);
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
      should.ok(Buffer.isBuffer(result.data));
      result.status.should.equal(404);
      count.should.equal(3);
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
      should.ok(Buffer.isBuffer(result.data));
      result.status.should.equal(200);
      count.should.equal(3);
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
      err.code.should.equal('ECONNREFUSED');
      count.should.equal(3);
      done();
    });
  });

});
