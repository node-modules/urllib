'use strict';

var assert = require('assert');
var urllib = require('../');

describe('test/digest_auth.test.js', function () {
  it('should request with digest auth success with 404 in httpbin', function (done) {
    var url = 'http://httpbin.org/hidden-basic-auth/user3/user3';
    urllib.request(url, {
      digestAuth: 'user3:user3',
      timeout: 25000,
    }, function (err, data, res) {
      assert(!err);
      assert(res.statusCode === 404);
      done();
    });
  }).timeout(30 * 1000);

  it('should request with digest auth fail in httpbin', function (done) {
    var url = 'http://httpbin.org/digest-auth/auth/user/passwd';
    urllib.request(url, {
      digestAuth: 'user:fail',
      timeout: 25000,
    }, function (err, data, res) {
      assert(!err);
      assert(res.statusCode === 401);
      assert(res.headers['www-authenticate']);
      done();
    });
  }).timeout(30 * 1000);

  it('should request with digest auth success in httpbin', function (done) {
    var url = 'http://httpbin.org/digest-auth/auth/user/passwd';
    urllib.request(url, {
      digestAuth: 'user:passwd',
      dataType: 'json',
      timeout: 10000,
    }, function (err, data, res) {
      assert(!err);
      assert(res.statusCode === 200);
      assert.deepEqual(data, {
        user: "user",
        authenticated: true,
      });
      done();
    });
  }).timeout(30 * 1000);
});
