/**!
 * urllib - httpclient.test.js
 *
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
var urllib = require('../');

describe('test/httpclient.test.js', function () {
  it('should requestThunk()', function (done) {
    var client = urllib.create();
    client.hasCustomAgent.should.equal(false);
    client.hasCustomHttpsAgent.should.equal(false);
    client.requestThunk('https://npm.taobao.org', {
      timeout: 25000
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
    client.curl('https://npm.taobao.org', {
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
    client.curl('https://npm.taobao.org/package/pedding', {
      timeout: 25000
    }).then(function (result) {
      result.data.should.be.a.Buffer;
      result.status.should.equal(200);
      done();
    }).catch(done);
  });
});
