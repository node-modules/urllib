'use strict';

var dns = require('dns');
var assert = require('power-assert');
var pedding = require('pedding');
var HttpsAgent = require('agentkeepalive').HttpsAgent;
var httpsAgent = new HttpsAgent({ keepAlive: true });
var urllib = require('..');

describe('timing.test.js', function() {
  var firstDnsLookup;
  it('should get timing data', function(done) {
    urllib.request('https://r.cnpmjs.org/urllib', {
      timing: true,
      timeout: 10000,
      httpsAgent: httpsAgent,
    }, function(err, data, res) {
      assert(!err);
      assert(data);
      assert(!res.keepAliveSocket);
      assert(res.timing);
      console.log(res.timing);
      assert(res.timing.queuing >= 0);
      firstDnsLookup = res.timing.dnslookup;
      // {queuing:0,dnslookup:0,connected:0,requestSent:0,waiting:188,contentDownload:219}
      assert(res.timing.connected >= 0);
      // requestSent is wrong on 0.10.x
      if (/^v0\.10\.\d+$/.test(process.version)) {
        assert(res.timing.requestSent >= 0);
        // socket lookup event wont fire on 0.10
        assert(res.timing.dnslookup === 0);
      } else {
        assert(res.timing.requestSent >= 0);
        assert(res.timing.dnslookup >= 0);
      }
      assert(res.timing.waiting > 0);
      assert(res.timing.contentDownload > 0);
      assert(res.timing.contentDownload === res.rt);

      // keepalive request again should be faster
      setImmediate(function() {
        urllib.request('https://r.cnpmjs.org/urllib', {
          timing: true,
          timeout: 10000,
          httpsAgent: httpsAgent,
        }, function(err, data, res2) {
          assert(!err);
          assert(data);
          assert(res2.keepAliveSocket);
          assert(res2.timing);
          console.log(res2.timing);
          assert(res2.timing.queuing >= 0);
          assert(res2.timing.waiting >= 0);
          assert(res2.timing.contentDownload > 0);
          // requestSent is wrong on 0.10.x
          if (!/^v0\.10\.\d+$/.test(process.version)) {
            assert(res2.timing.requestSent <= res.timing.requestSent);
          }

          // connected and dnslookup should be 0
          assert(res2.timing.dnslookup === 0);
          assert(res2.timing.connected === 0);

          assert(res2.timing.contentDownload === res2.rt);
          done();
        });
      });
    });
  });

  it('should dns cache on https', function(done) {
    urllib.request('https://r.cnpmjs.org/urllib', {
      timing: true,
      timeout: 10000,
      // disable keepalive
      httpsAgent: false,
    }, function(err, data, res) {
      assert(!err);
      assert(data);
      assert(res.timing);
      console.log(res.timing);
      // if (/^v0\.10\.\d+$/.test(process.version)) {
      //   // socket lookup event wont fire on 0.10
      //   assert(res.timing.dnslookup === 0);
      // } else {
      //   assert(res.timing.dnslookup < firstDnsLookup);
      // }
      done();
    });
  });

  it('should dns cache on http', function(done) {
    urllib.request('http://r.cnpmjs.org/urllib', {
      timing: true,
      timeout: 10000,
      // disable keepalive
      agent: false,
    }, function(err, data, res) {
      assert(!err);
      assert(data);
      assert(res.timing);
      console.log(res.timing);
      // if (/^v0\.10\.\d+$/.test(process.version)) {
      //   // socket lookup event wont fire on 0.10
      //   assert(res.timing.dnslookup === 0);
      // } else {
      //   assert(res.timing.dnslookup < firstDnsLookup);
      // }
      done();
    });
  });

  // FIXME: why https request not support options.lookup
  it.skip('should custom dns lookup work on https', function(done) {
    done = pedding(2, done);
    urllib.request('https://r.cnpmjs.org/urllib', {
      timing: true,
      timeout: 10000,
      // disable keepalive
      httpsAgent: false,
      lookup: function foo(host, dnsopts, callback) {
        setTimeout(function() {
          assert(host === 'r.cnpmjs.org');
          dns.lookup(host, dnsopts, callback);
          done();
        }, 123);
      },
    }, function(err, data, res) {
      assert(!err);
      assert(data);
      assert(res.timing);
      console.log(res.timing);
      if (/^v0\.10\.\d+$/.test(process.version)) {
        // socket lookup event wont fire on 0.10
        assert(res.timing.dnslookup === 0);
      } else {
        assert(res.timing.dnslookup >= 123);
      }
      done();
    });
  });

  it('should custom dns lookup work on http', function(done) {
    done = pedding(2, done);
    urllib.request('http://r.cnpmjs.org/urllib', {
      timing: true,
      timeout: 10000,
      // disable keepalive
      agent: false,
      lookup: function foo(host, dnsopts, callback) {
        console.log('custom dns lookup %s, %j', host, dnsopts);
        setTimeout(function() {
          assert(host === 'r.cnpmjs.org');
          dns.lookup(host, dnsopts, callback);
          done();
        }, 123);
      },
    }, function(err, data, res) {
      assert(!err);
      assert(data);
      assert(res.timing);
      console.log(res.timing);
      // custom dns lookup require node >= 4.0.0
      if (/^v0\./.test(process.version)) {
        // make pedding finish
        done();
      } else {
        assert(res.timing.dnslookup >= 123);
      }
      done();
    });
  });
});
