'use strict';

var assert = require('power-assert');
var https = require('https');
var httpsAgent = new https.Agent({ keepAlive: true });
var urllib = require('..');

describe('timing.test.js', function() {
  it('should get timing data', function(done) {
    urllib.request('https://cnpmjs.org', {
      timing: true,
      timeout: 10000,
      httpsAgent: httpsAgent,
    }, function(err, data, res) {
      assert(!err);
      assert(data);
      assert(res.timing);
      console.log(res.timing);
      assert(res.timing.queuing >= 0);
      assert(res.timing.connected > 0);
      assert(res.timing.requestSent > 0);
      assert(res.timing.waiting > 0);
      assert(res.timing.contentDownload > 0);
      assert(res.timing.contentDownload === res.rt);

      // keepalive request again should be faster
      setImmediate(function() {
        urllib.request('https://cnpmjs.org', {
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
          // connected, requestSent should less than res1
          assert(res2.timing.connected < res.timing.connected);
          assert(res2.timing.requestSent < res.timing.requestSent);
          assert(res2.timing.waiting < res.timing.waiting);
          assert(res2.timing.contentDownload < res.timing.contentDownload);

          // queuing should equal to connected time
          assert(res2.timing.connected === res2.timing.queuing);
          assert(res2.timing.contentDownload === res2.rt);
          done();
        });
      });
    });
  });
});
