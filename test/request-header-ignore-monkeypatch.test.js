'use strict';

var assert = require('assert');
var urllib = require('..');
var server = require('./fixtures/server');

describe('test/request-header-ignore-monkeypatch.test.js', function() {
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
    delete Object.prototype.noop;
    setTimeout(function() {
      server.close();
      done();
    }, 1000);
  });

  it('should only use headers owner properties', function(done) {
    Object.prototype.noop = function () {};
    var headers = {
      'content-type': 'application/json',
      charset: 'utf-8',
    };
    Object.defineProperties(headers, {
      one: { enumerable: true, value: 'one' },
      two: { enumerable: false, value: function() {} },
    });
    var url = host + '/headers';
    urllib.request(url, {
      timeout: 1500,
      dataType: 'json',
      headers: headers,
    }, function(err, data) {
      assert(!err);
      assert(data);
      assert(data.charset === 'utf-8');
      assert(data.one === 'one');
      done();
    });
  });
});
