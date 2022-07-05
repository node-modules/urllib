'use strict';

var assert = require('assert');
var urllib = require('..');
var proxy = require('./fixtures/reverse-proxy');
var isNode010 = /^v0\.10\.\d+$/.test(process.version);
var isNode012 = /^v0\.12\.\d+$/.test(process.version);

var testUrl = process.env.CI ? 'https://registry.npmjs.com' : 'https://registry.npmmirror.com';

if (!isNode010 && !isNode012) {
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
      urllib.request('http://registry.npmmirror.com/pedding/1.0.0', {
        enableProxy: true,
        proxy: proxyUrl,
      }, function(err, data, res) {
        assert(!err);
        assert(res.status === 301);
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
}
