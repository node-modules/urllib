/**
 * Copyright(c) node-modules and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var dns = require('dns');
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
      res._requestUrl.length.should.above(1);
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
        res._requestUrl.length.should.above(1);
        done();
      });
    });
  });
});
