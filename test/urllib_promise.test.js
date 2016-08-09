'use strict';

var should = require('should');
var config = require('./config');
var urllib = require('../');

describe('test/urllib_promise.test.js', function () {
  it('should return promise when callback missing', function () {
    return urllib.request(config.npmWeb, {timeout: 20000})
    .then(function (result) {
      should.exist(result);
      result.should.have.keys('data', 'status', 'headers', 'res');
      should.exist(result.data);
      should.exist(result.res);
      result.data.should.be.a.Buffer;
      result.status.should.equal(200);
      result.res.should.status(200);
      result.res.should.have.header('connection');
      result.res.headers.connection.toLowerCase().should.equal('keep-alive');
      result.res.should.have.keys('status', 'statusCode', 'headers', 'rt',
        'size', 'aborted', 'keepAliveSocket', 'data', 'requestUrls', 'timing');
      result.res.status.should.equal(200);
      result.res.rt.should.above(0);
      result.res.size.should.above(0);
    });
  });

  it('should work with args', function () {
    return urllib.request(config.npmWeb, {
      data: {
        q: 'foo'
      },
      timeout: 20000
    })
    .then(function (result) {
      should.exist(result.data);
      should.exist(result.res);
      result.data.should.be.a.Buffer;
      result.res.should.status(200);
      result.res.should.have.header('connection');
      result.res.headers.connection.toLowerCase().should.equal('keep-alive');
    });
  });

  it('should throw error', function () {
    return urllib.request('http://127.0.0.1:11', {
      data: {
        q: 'foo'
      },
      timeout: 20000
    })
    .then(function () {
      throw new Error('should not run this');
    }).catch(function (err) {
      should.exist(err);
      err.code.should.equal('ECONNREFUSED');
      err.status.should.equal(-1);
      err.headers.should.eql({});
      err.res.should.have.keys('status', 'statusCode', 'headers', 'rt', 'size', 'aborted',
        'keepAliveSocket', 'data', 'requestUrls', 'timing');
    });
  });
});
