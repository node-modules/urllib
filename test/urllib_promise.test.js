/**!
 * urllib - test/urllib_promise.test.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var urllib = require('../');

describe('urllib_promise.test.js', function () {
  it('should return promise when callback missing', function (done) {
    urllib.request('http://nodejs.org')
    .then(function (result) {
      should.exist(result.data);
      should.exist(result.res);
      result.data.should.be.a.Buffer;
      result.res.should.status(200);
      result.res.should.have.header('connection', 'keep-alive');
      done();
    }).error(done);
  });

  it('should work with args', function (done) {
    urllib.request('http://nodejs.org', {
      data: {
        q: 'foo'
      }
    })
    .then(function (result) {
      should.exist(result.data);
      should.exist(result.res);
      result.data.should.be.a.Buffer;
      result.res.should.status(200);
      result.res.should.have.header('connection', 'keep-alive');
      done();
    }).error(done);
  });
});
