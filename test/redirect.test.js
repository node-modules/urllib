'use strict';

var dns = require('dns');
var urlresolve = require('url').resolve;
var config = require('./config');
var urllib = require('../');

describe('test/redirect.test.js', function() {
  it('should redirect `location: /package/pedding` with headers.Host', function(done) {
    var domain = config.npmWeb.replace('https://', '');
    var url = config.npmWeb + '/pedding';
    urllib.request(url, {
      timeout: 30000,
      headers: {
        Host: domain,
      },
      followRedirect: true,
    }, function(err, data, res) {
      if (err) {
        return done(err);
      }
      res.statusCode.should.equal(200);
      data.length.should.above(100);
      res.requestUrls.length.should.above(1);
      done();
    });
  });

  it('should redirect `location: http://other-domain` with headers.Host', function(done) {
    // https://r.cnpmjs.org/pedding/download/pedding-1.0.0.tgz
    var domain = 'cnpmjs.org';
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
        if (err) {
          return done(err);
        }
        res.statusCode.should.equal(200);
        data.length.should.above(100);
        res.requestUrls.length.should.above(1);
        done();
      });
    });
  });

  it('should use formatRedirectUrl', function(done) {
    var url = 'https://cnpmjs.org/pedding';
    urllib.request(url, {
      timeout: 30000,
      followRedirect: true,
      formatRedirectUrl: function(from, to) {
        return urlresolve(from, to.replace('/package/pedding', '/package/foo'));
      },
    }, function(err, data, res) {
      if (err) {
        return done(err);
      }
      res.statusCode.should.equal(200);
      data.length.should.above(100);
      res.requestUrls.length.should.above(1);
      done();
    });
  });
});
