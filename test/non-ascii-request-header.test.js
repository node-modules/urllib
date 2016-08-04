'use strict';

var assert = require('power-assert');
var urllib = require('..');

// https://github.com/node-modules/urllib/issues/198
describe('non ascii request header', function() {
  it('should error when request headers contain non ascii', function(done) {
    urllib.request('http://foo.com', { headers: { 'x-test': '中文' } }, function(err, data, res) {
      assert(err);
      assert(data === undefined);
      assert(res);
      assert(res.status === -1);
      done();
    });
  });

  it('should reject error on promise way', function(done) {
    urllib.request('http://foo.com', { headers: { 'x-test': '中文' } }).catch(function(err) {
      assert(err);
      assert(err.res);
      assert(err.res.status === -1);
      done();
    });
  });

  it('should error on thunk way', function(done) {
    urllib.requestThunk('http://foo.com', { headers: { 'x-test': '中文' } })(function(err) {
      assert(err);
      assert(err.res);
      assert(err.res.status === -1);
      done();
    });
  });
});
