'use strict';

import assert from 'assert';
import urllib from '../src';

describe('options.followRedirect.test.js', () => {
  it('should redirect `location: /package/pedding` with headers.Host', async () => {
    const requestURL = 'https://registry.npmmirror.com/pedding/-/pedding-1.1.0.tgz';
    const { data, res, redirected, url } = await urllib.request(requestURL, {
      timeout: 30000,
      headers: {
        // Host: 'registry.npmmirror.com',
      },
      followRedirect: true,
    });
    // console.log(res.headers);
    // console.log((data as Buffer).toString());
    assert.equal(res.statusCode, 200);
    assert((data as Buffer).length > 100);
    assert(redirected);
    assert.equal(url, 'https://cdn.npmmirror.com/packages/pedding/1.1.0/pedding-1.1.0.tgz');
    // assert(res.requestUrls.length > 1);
  });

  it('should disable auto redirect', async () => {
    const requestURL = 'https://registry.npmmirror.com/pedding/-/pedding-1.1.0.tgz';
    const { data, res, redirected, url } = await urllib.request(requestURL, {
      timeout: 30000,
      followRedirect: false,
      dataType: 'text',
    });
    assert(res.statusCode === 302);
    assert.equal(typeof data, 'string');
    assert((data as string).length > 0);
    assert(!redirected);
    assert.equal(url, requestURL);
    assert.equal(res.headers.location, 'https://cdn.npmmirror.com/packages/pedding/1.1.0/pedding-1.1.0.tgz');
  });

  // it('should redirect `location: http://other-domain` with headers.Host', function(done) {
  //   var domain = 'npmjs.com';
  //   dns.lookup(domain, function(err, address) {
  //     if (err) {
  //       return done(err);
  //     }
  //     var url = 'http://' + address + '/pedding';
  //     urllib.request(url, {
  //       timeout: 30000,
  //       headers: {
  //         Host: domain,
  //       },
  //       followRedirect: true,
  //     }, function(err, data, res) {
  //       assert(!err);
  //       assert(res.statusCode === 200);
  //       assert(data.length > 100);
  //       assert(res.requestUrls.length > 1);
  //       done();
  //     });
  //   });
  // });

  // it('should use formatRedirectUrl', async () => {
  //   var url = 'https://npmjs.com/pedding';
  //   urllib.request(url, {
  //     timeout: 30000,
  //     followRedirect: true,
  //     formatRedirectUrl: function(from, to) {
  //       return urlresolve(from, to.replace('/package/pedding', '/package/foo'));
  //     },
  //   }, function(err, data, res) {
  //     assert(!err);
  //     assert(res.statusCode === 200);
  //     assert(data.length > 100);
  //     assert(res.requestUrls.length > 1);
  //     done();
  //   });
  // });
});
