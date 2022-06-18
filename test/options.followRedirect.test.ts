import assert from 'assert/strict';
import urllib from '../src';
import { startServer } from './fixtures/server';

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
    const { data, res, redirected, url } = await urllib.request(requestURL, {
      followRedirect: true,
    });
    // console.log(res.headers);
    assert.equal(res.statusCode, 200);
    assert((data as Buffer).length > 100);
    assert(redirected);
    assert.equal(url, `${_url}redirect-to-url`);
    // assert(res.requestUrls.length > 1);
  });

  it('should redirect `location: /redirect-full-to-url`', async () => {
    const requestURL = `${_url}redirect-full`;
    const { data, res, redirected, url } = await urllib.request(requestURL, {
      followRedirect: true,
    });
    // console.log(res.headers);
    assert.equal(res.statusCode, 200);
    assert((data as Buffer).length > 100);
    assert(redirected);
    assert.equal(url, `${_url}redirect-full-to-url`);
    // assert(res.requestUrls.length > 1);
  });

  it('should redirect `location: /redirec-full-301-to-url`', async () => {
    const requestURL = `${_url}redirect-full-301`;
    const { data, res, redirected, url } = await urllib.request(requestURL, {
      followRedirect: true,
    });
    // console.log(res.headers);
    assert.equal(res.statusCode, 200);
    assert((data as Buffer).length > 100);
    assert(redirected);
    assert.equal(url, `${_url}redirect-full-301-to-url`);
    // assert(res.requestUrls.length > 1);
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
