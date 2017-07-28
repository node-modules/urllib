'use strict';

var assert = require('assert');
var urllib = require('..');
var proxy = require('./fixtures/reverse-proxy');

var testUrl = process.env.CI ? 'https://registry.npmjs.org' : 'https://registry.cnpmjs.org';

describe('test/proxy.test.js', function() {
  var port;
  var proxyUrl;
  before(function(done) {
    proxy.listen(0, function() {
      port = proxy.address().port;
      proxyUrl = 'http://127.0.0.1:' + port;
      console.log('proxy: %s', proxyUrl);
      done();
    });
  });
  after(function() {
    proxy.close();
  });

  it('should proxy http work', function(done) {
    urllib.request(testUrl.replace('https', 'http') + '/pedding/latest', {
      dataType: 'json',
      enableProxy: true,
      proxy: proxyUrl,
    }, function(err, data, res) {
      assert(!err);
      assert(data.name === 'pedding');
      assert(res.status === 200);
      done();
    });
  });

  it('should proxy https work', function(done) {
    urllib.request(testUrl + '/pedding/latest', {
      dataType: 'json',
      enableProxy: true,
      proxy: proxyUrl,
    }, function(err, data, res) {
      assert(!err);
      assert(data.name === 'pedding');
      assert(res.status === 200);
      done();
    });
  });
});
