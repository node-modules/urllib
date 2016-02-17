/**
 * Copyright(c) node-modules and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var config = require('./config');
var urllib = require('../');

describe('test/urllib_promise.test.js', function () {
  it('should return promise when callback missing', function (done) {
    urllib.request(config.npmWeb, {timeout: 20000})
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
      result.res.should.have.keys('status', 'statusCode', 'headers', 'rt', 'size', 'aborted', 'keepAliveSocket', 'data');
      result.res.status.should.equal(200);
      result.res.rt.should.above(0);
      result.res.size.should.above(0);
      done();
    }).catch(done);
  });

  it('should work with args', function (done) {
    urllib.request(config.npmWeb, {
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
      done();
    }).catch(done);
  });

  it('should throw error', function (done) {
    urllib.request('http://127.0.0.1:11', {
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
      err.res.should.have.keys('status', 'statusCode', 'headers', 'rt', 'size', 'aborted', 'keepAliveSocket', 'data');
      done();
    });
  });
});
