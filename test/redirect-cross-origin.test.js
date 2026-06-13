'use strict';

var assert = require('assert');
var http = require('http');
var urllib = require('../');

// On a cross-origin redirect, credential-bearing request headers
// (Authorization, Cookie, Proxy-Authorization) and the `auth` option must NOT
// be forwarded to the new origin. Same-origin redirects should keep them.
describe('test/redirect-cross-origin.test.js', function() {
  var serverA;
  var serverB;
  var portA;
  var portB;

  before(function(done) {
    serverB = http.createServer(function(req, res) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(req.headers));
    });
    serverB.listen(0, function() {
      portB = serverB.address().port;
      serverA = http.createServer(function(req, res) {
        if (req.url === '/start-cross') {
          res.statusCode = 302;
          res.setHeader('Location', 'http://127.0.0.1:' + portB + '/captured');
          return res.end('redirect to B');
        }
        if (req.url === '/start-same') {
          res.statusCode = 302;
          res.setHeader('Location', '/captured');
          return res.end('redirect to self');
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(req.headers));
      });
      serverA.listen(0, function() {
        portA = serverA.address().port;
        done();
      });
    });
  });

  after(function() {
    if (serverA) {
      serverA.close();
    }
    if (serverB) {
      serverB.close();
    }
  });

  function credentialHeaders() {
    return {
      Authorization: 'Bearer LIVE-AUTH',
      Cookie: 'session=LIVE-COOKIE',
      'Proxy-Authorization': 'Bearer proxy-LIVE',
    };
  }

  it('should NOT forward credential headers on cross-origin redirect', function(done) {
    urllib.request('http://127.0.0.1:' + portA + '/start-cross', {
      followRedirect: true,
      headers: credentialHeaders(),
    }, function(err, data, res) {
      assert(!err);
      assert.equal(res.statusCode, 200);
      assert.equal(res.requestUrls.length, 2);
      var received = JSON.parse(data.toString());
      assert.equal(received.authorization, undefined);
      assert.equal(received.cookie, undefined);
      assert.equal(received['proxy-authorization'], undefined);
      done();
    });
  });

  it('should keep credential headers on same-origin redirect', function(done) {
    urllib.request('http://127.0.0.1:' + portA + '/start-same', {
      followRedirect: true,
      headers: credentialHeaders(),
    }, function(err, data, res) {
      assert(!err);
      assert.equal(res.statusCode, 200);
      assert.equal(res.requestUrls.length, 2);
      var received = JSON.parse(data.toString());
      assert.equal(received.authorization, 'Bearer LIVE-AUTH');
      assert.equal(received.cookie, 'session=LIVE-COOKIE');
      assert.equal(received['proxy-authorization'], 'Bearer proxy-LIVE');
      done();
    });
  });

  it('should NOT re-inject Basic auth (options.auth) on cross-origin redirect', function(done) {
    urllib.request('http://127.0.0.1:' + portA + '/start-cross', {
      followRedirect: true,
      auth: 'user:passwd',
    }, function(err, data, res) {
      assert(!err);
      assert.equal(res.statusCode, 200);
      var received = JSON.parse(data.toString());
      assert.equal(received.authorization, undefined);
      done();
    });
  });

  it('should keep Basic auth (options.auth) on same-origin redirect', function(done) {
    urllib.request('http://127.0.0.1:' + portA + '/start-same', {
      followRedirect: true,
      auth: 'user:passwd',
    }, function(err, data, res) {
      assert(!err);
      assert.equal(res.statusCode, 200);
      var received = JSON.parse(data.toString());
      assert.equal(received.authorization, 'Basic ' + Buffer.from('user:passwd').toString('base64'));
      done();
    });
  });

  it('should not mutate the caller options object on cross-origin redirect', function(done) {
    var headers = credentialHeaders();
    var opts = { followRedirect: true, auth: 'user:passwd', digestAuth: 'user:passwd', headers: headers };
    urllib.request('http://127.0.0.1:' + portA + '/start-cross', opts, function(err, data, res) {
      assert(!err);
      assert.equal(res.statusCode, 200);
      // credentials were stripped on the wire
      var received = JSON.parse(data.toString());
      assert.equal(received.authorization, undefined);
      // but the caller's reusable options object is untouched
      assert.equal(opts.auth, 'user:passwd');
      assert.equal(opts.digestAuth, 'user:passwd');
      assert.equal(opts.headers, headers);
      assert.equal(opts.headers.Authorization, 'Bearer LIVE-AUTH');
      done();
    });
  });
});
