'use strict';

var assert = require('assert');
var urllib = require('../');

describe('test/digest_auth.test.js', function () {
  it('should request with digest auth success in webdav', function (done) {
    var url = 'http://test.webdav.org/auth-digest/user3';
    urllib.request(url, {
      digestAuth: 'user3:user3',
      timeout: 20000,
    }, function (err, data, res) {
      assert(!err);
      assert(res.statusCode === 404);
      assert(data.toString().indexOf('<p>The requested URL /auth-digest/user3 was not found on this server.</p>') >= 0);
      done();
    });
  }).timeout(30 * 1000);

  it('should request with digest auth fail in webdav', function (done) {
    var url = 'http://test.webdav.org/auth-digest/user3';
    urllib.request(url, {
      digestAuth: 'user3:fail',
      timeout: 20000,
    }, function (err, data, res) {
      assert(!err);
      assert(res.statusCode === 401);
      assert(res.headers['www-authenticate']);
      assert(data.toString().indexOf('401 Authorization Required') >= 0);
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
