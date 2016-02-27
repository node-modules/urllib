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

var pedding = require('pedding');
var should = require('should');
var config = require('./config');
var urllib = require('../');

describe('test/httpclient.test.js', function () {
  it('should request without args work', function (done) {
    var client = urllib.create();
    client.request(config.npmRegistry + '/pedding/*', function (err, data, res) {
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
      timeout: 25000
    })(function (err, result) {
      should.not.exist(err);
      result.data.should.be.a.Buffer;
      result.status.should.equal(200);
      done();
    });

    client.requestThunk(config.npmRegistry + '/pedding/*')(function (err, result) {
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
      result.data.should.be.a.Buffer;
      result.status.should.equal(200);
      done();
    }).catch(done);
  });
});
