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
var urllib = require('../');

describe('test/redirect.test.js', function() {
  it('should work with headers.Host', function(done) {
    // https://registry.npm.taobao.org/pedding/download/pedding-1.0.0.tgz
    dns.lookup('registry.npm.taobao.org', function(err, address) {
      if (err) {
        return done(err);
      }
      var url = 'https://' + address + '/pedding/download/pedding-1.0.0.tgz';
      urllib.request(url, {
        timeout: 30000,
        headers: {
          Host: 'registry.npm.taobao.org',
        },
        followRedirect: true,
      }, function(err, data, res) {
        if (err) {
          return done(err);
        }
        res.statusCode.should.equal(200);
        data.length.should.above(100);
        done();
      });
    });
  });
});
