'use strict';

var assert = require('assert');
var dns = require('dns');
var urlresolve = require('url').resolve;
var urllib = require('../');

describe('test/redirect.test.js', function() {
  it('should redirect `location: /package/pedding` with headers.Host', function(done) {
    var url = 'https://registry.npmmirror.com/pedding/-/pedding-1.1.0.tgz';
    urllib.request(url, {
      timeout: 30000,
      headers: {
        Host: 'registry.npmmirror.com',
      },
      followRedirect: true,
    }, function(err, data, res) {
      assert(!err);
      assert(res.statusCode === 200);
      assert(data.length > 100);
      assert(res.requestUrls.length > 1);
      done();
    });
  });

  it('should redirect `location: http://other-domain` with headers.Host', function(done) {
    var domain = 'npmjs.com';
    dns.lookup(domain, function(err, address) {
      if (err) {
        return done(err);
      }
      var url = 'http://' + address + '/pedding';
      urllib.request(url, {
        timeout: 30000,
        headers: {
          Host: domain,
        },
        followRedirect: true,
      }, function(err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(data.length > 100);
        assert(res.requestUrls.length > 1);
        done();
      });
    });
  });

  it('should use formatRedirectUrl', function(done) {
    var url = 'https://npmjs.com/pedding';
    urllib.request(url, {
      timeout: 30000,
      followRedirect: true,
      formatRedirectUrl: function(from, to) {
        return urlresolve(from, to.replace('/package/pedding', '/package/foo'));
      },
    }, function(err, data, res) {
      assert(!err);
      assert(res.statusCode === 200);
      assert(data.length > 100);
      assert(res.requestUrls.length > 1);
      done();
    });
  });
});
