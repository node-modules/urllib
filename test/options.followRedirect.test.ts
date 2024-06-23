import { strict as assert } from 'node:assert';
import { describe, it, beforeAll, afterAll } from 'vitest';
import urllib from '../src/index.js';
import { startServer } from './fixtures/server.js';

describe('options.followRedirect.test.js', () => {
  let close: any;
  let _url: string;
  beforeAll(async () => {
    const { closeServer, url } = await startServer();
    close = closeServer;
    _url = url;
  });

  afterAll(async () => {
    await close();
  });

  it('should redirect `location: /redirect-to-url`', async () => {
    const requestURL = `${_url}redirect`;
    const response = await urllib.request(requestURL, {
      followRedirect: true,
    });
    assert.equal(response.res.statusCode, 200);
    assert.equal(response.statusCode, response.res.statusCode);
    assert.equal(response.statusText, 'OK');
    assert((response.data as Buffer).length > 100);
    assert.equal(response.url, `${_url}redirect-to-url`);
    assert.equal(response.requestUrls.length, 2);
  });

  it('should followRedirect is true and maxRedirects default up to 10', async () => {
    const requestURL = `${_url}redirect-deadlock`;
    const response = await urllib.request(requestURL, {
      dataType: 'text',
    });
    assert.equal(response.res.statusCode, 302);
    assert.equal(response.statusText, 'Found');
    assert.equal(response.url, `${_url}redirect-deadlock`);
    assert.equal(response.requestUrls.length, 11);
    assert.equal(response.data, 'Redirect to /redirect-deadlock');
  });

  it('should maxRedirects=1 work', async () => {
    const requestURL = `${_url}redirect-deadlock`;
    const response = await urllib.request(requestURL, {
      maxRedirects: 1,
      dataType: 'text',
    });
    assert.equal(response.res.statusCode, 302);
    assert.equal(response.url, `${_url}redirect-deadlock`);
    assert.equal(response.requestUrls.length, 2);
    assert.equal(response.data, 'Redirect to /redirect-deadlock');
    assert.deepEqual(response.requestUrls, [ `${_url}redirect-deadlock`, `${_url}redirect-deadlock` ]);
  });

  it('should maxRedirects=0 work', async () => {
    const requestURL = `${_url}redirect-deadlock`;
    const response = await urllib.request(requestURL, {
      maxRedirects: 0,
      dataType: 'text',
    });
    assert.equal(response.res.statusCode, 302);
    assert.equal(response.url, `${_url}redirect-deadlock`);
    assert.equal(response.data, 'Redirect to /redirect-deadlock');
    assert.deepEqual(response.requestUrls, [ `${_url}redirect-deadlock` ]);
  });

  it('should redirect `location: /redirect-full-to-url`', async () => {
    const requestURL = `${_url}redirect-full`;
    const { data, res, redirected, url, requestUrls } = await urllib.request(requestURL, {
      followRedirect: true,
    });
    // console.log(res.headers);
    assert.equal(res.statusCode, 200);
    assert((data as Buffer).length > 100);
    assert(redirected);
    assert.equal(url, `${_url}redirect-full-to-url`);
    assert.equal(requestUrls.length, 2);
  });

  it('should redirect `location: /redirec-full-301-to-url`', async () => {
    const requestURL = `${_url}redirect-full-301`;
    const { data, res, redirected, url, requestUrls } = await urllib.request(requestURL, {
      followRedirect: true,
    });
    // console.log(res.headers);
    assert.equal(res.statusCode, 200);
    assert((data as Buffer).length > 100);
    assert(redirected);
    assert.equal(url, `${_url}redirect-full-301-to-url`);
    assert.equal(requestUrls.length, 2);
  });

  it('should disable auto redirect', async () => {
    const requestURL = `${_url}redirect-full-301`;
    const { data, res, redirected, url } = await urllib.request(requestURL, {
      timeout: 30000,
      followRedirect: false,
      dataType: 'text',
    });
    assert(res.statusCode === 301);
    assert.equal(typeof data, 'string');
    assert(!redirected);
    assert.equal(url, requestURL);
    assert.equal(res.headers.location, `${_url}redirect-full-301-to-url`);
    assert(res.socket.remoteAddress === '127.0.0.1' || res.socket.remoteAddress === '::1');
    assert(res.socket.id > 0);
    assert(res.timing.contentDownload > 0);
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
