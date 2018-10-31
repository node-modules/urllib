'use strict';

var assert = require('assert');
var Agent = require('agentkeepalive');
var urllib = require('..');
var server = require('./fixtures/server');

describe('test/request-timeout.test.js', function() {
  var host = 'http://127.0.0.1:';
  var port;

  before(function(done) {
    server.listen(0, function() {
      port = server.address().port;
      host += port;
      done();
    });
  });

  after(function(done) {
    setTimeout(function() {
      server.close();
      done();
    }, 1000);
  });

  it('should work on request timeout bigger than agent timeout', function(done) {
    var agent = new Agent({
      timeout: 1000,
    });
    var url = host + '/response_timeout_10s';
    urllib.request(url, {
      timeout: 1500,
      agent: agent,
    }, function(err) {
      assert(err);
      assert(err.name === 'ResponseTimeoutError');
      assert(err.message.indexOf('Response timeout for 1500ms') === 0);
      done();
    });
  });
});
