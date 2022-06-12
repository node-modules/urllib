'use strict';

var assert = require('assert');
var urllib = require('..');

describe('test/request-error-before-connect-timeout.test.js', function() {
  it('should cancel connect timer after request error', function(done) {
    var url = 'https://r.cnpmjs.org/pedding';
    var req = urllib.request(url, {
      timeout: 100,
    }, function(err) {
      assert(err);
      assert(err.name === 'RequestError');
      assert(err.message.indexOf('socket hang up') !== -1);
      done();
    });
    process.nextTick(function() {
      req.abort();
    });
  });
});
