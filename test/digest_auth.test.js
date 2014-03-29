/**!
 * urllib - test/digest_auth.test.js
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

describe('digest_auth.test.js', function () {
  describe('digestAuthHeader()', function () {
    it('should create auth header', function () {
      var serverAuth1 = 'Digest realm="test", nonce="AwrIOLT1BAA=c02c74925294185a304a50a27e25214fe4caafec", algorithm=MD5, domain="/auth-digest/", qop="auth"';
      var header = urllib.digestAuthHeader('GET', '/', serverAuth1, 'user1:pass1');
      header.should.include('Digest username="user1", realm="test", nonce="AwrIOLT1BAA=c02c74925294185a304a50a27e25214fe4caafec", uri="/", response="');
      header.should.include(', qop=auth, ');

      var serverAuth2 = 'Digest realm="me@kennethreitz.com", nonce="9fa37e281ff24157ce2ffece0778d04b", opaque="c6fb900fddb8797febbf3e3368999e70", qop=auth';
      header = urllib.digestAuthHeader('get', '/', serverAuth2, 'user2:pass2');
      header.should.include('opaque="c6fb900fddb8797febbf3e3368999e70"');
      header.should.include('Digest username="user2", realm="me@kennethreitz.com", nonce="9fa37e281ff24157ce2ffece0778d04b", uri="/", response="');
    });

    it('should work for no qop', function () {
      var serverAuth1 = 'Digest realm="test", nonce="AwrIOLT1BAA=c02c74925294185a304a50a27e25214fe4caafec", algorithm=MD5, domain="/auth-digest/"';
      var header = urllib.digestAuthHeader('GET', '/', serverAuth1, 'user1:pass1');
      header.should.equal('Digest username=\"user1\", realm=\"test\", nonce=\"AwrIOLT1BAA=c02c74925294185a304a50a27e25214fe4caafec\", uri=\"/\", response=\"5152194a5873b5136b8a320643424fdc\"');
    });

    it('should sum the response as chrome', function () {
      // Authorization:Digest username="user", realm="me@kennethreitz.com",
      // nonce="e2b5c8057c85ec1ea22339aff3a1f411", uri="/digest-auth/auth/user/passwd",
      // response="ff708534be81a3998a56014457f14cc1",
      // opaque="1e111b7029d7e1ce29a51ceb57f1753b", qop=auth, nc=00000001, cnonce="4d05d72eab7bb9f6"
      var auth = 'Digest username="user", realm="me@kennethreitz.com", nonce="e2b5c8057c85ec1ea22339aff3a1f411", uri="/digest-auth/auth/user/passwd", response="ff708534be81a3998a56014457f14cc1", opaque="1e111b7029d7e1ce29a51ceb57f1753b", qop=auth, nc=00000001, cnonce="4d05d72eab7bb9f6"';
      var header = urllib.digestAuthHeader('GET', '/digest-auth/auth/user/passwd',
        auth, 'user:passwd', {nc: '00000001', cnonce: '4d05d72eab7bb9f6'});
      header.should.equal(auth);
    });
  });

  it('should request with digest auth success in webdav', function (done) {
    var url = 'http://test.webdav.org/auth-digest/user3';
    urllib.request(url, {
      digestAuth: 'user3:user3',
    }, function (err, data, res) {
      should.not.exist(err);
      res.should.status(404);
      data = data.toString();
      data.should.include('<p>The requested URL /auth-digest/user3 was not found on this server.</p>');
      done();
    });
  });

  it('should request with digest auth fail in webdav', function (done) {
    var url = 'http://test.webdav.org/auth-digest/user3';
    urllib.request(url, {
      digestAuth: 'user3:fail',
    }, function (err, data, res) {
      should.not.exist(err);
      res.should.status(401);
      res.should.have.header('www-authenticate');
      data = data.toString();
      data.should.include('401 Authorization Required');
      done();
    });
  });

  it('should request with digest auth success in httpbin', function (done) {
    var url = 'http://httpbin.org/digest-auth/auth/user/passwd';
    urllib.request(url, {
      digestAuth: 'user:passwd',
      dataType: 'json',
    }, function (err, data, res) {
      should.not.exist(err);
      res.should.status(200);
      data.should.eql({
        user: "user",
        authenticated: true
      });
      done();
    });
  });
});
