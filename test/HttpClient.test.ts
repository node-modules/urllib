import { describe, it, beforeAll, afterAll } from 'vitest';
import { strict as assert } from 'assert';
import dns from 'dns';
import { HttpClient } from '../src';
import { HttpClientResponseMeta } from '../src/Response';
import { startServer } from './fixtures/server';

describe('HttpClient.test.ts', () => {
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

  describe('clientOptions.defaultArgs', () => {
    it('should work with custom defaultArgs', async () => {
      const httpclient = new HttpClient({ defaultArgs: { timeout: 1000 } });
      assert(httpclient);
    });
  });

  describe('clientOptions.lookup', () => {
    it('should work with custom lookup on HTTP protol', async () => {
      let lookupCallCounter = 0;
      const httpclient = new HttpClient({
        // mock lookup delay
        lookup(...args) {
          lookupCallCounter++;
          setTimeout(() => {
            dns.lookup(...args);
          }, 100);
        },
      });
      let response = await httpclient.request(_url);
      assert.equal(lookupCallCounter, 1);
      assert.equal(response.status, 200);
      const res = response.res as HttpClientResponseMeta;
      assert(res.rt > 100, `rt ${res.rt} should bigger than 100`);
      // will cache dns lookup
      let count = 10;
      while (count-- > 0) {
        response = await httpclient.request(_url);
      }
      assert(lookupCallCounter < 10, `${lookupCallCounter} should smaller than 10`);
    });

    it('should work with custom lookup on HTTPS protol', async () => {
      let lookupCallCounter = 0;
      const httpclient = new HttpClient({
        // mock lookup delay
        lookup(...args) {
          lookupCallCounter++;
          setTimeout(() => {
            dns.lookup(...args);
          }, 100);
        },
      });
      let response = await httpclient.request('https://registry.npmmirror.com/urllib');
      assert.equal(lookupCallCounter, 1);
      assert.equal(response.status, 200);
      const res = response.res as HttpClientResponseMeta;
      // console.log(res);
      assert(res.rt > 100, `rt ${res.rt} should bigger than 100`);
      // will cache dns lookup
      let count = 5;
      while (count-- > 0) {
        response = await httpclient.request(_url);
      }
      assert(lookupCallCounter < 5, `${lookupCallCounter} should smaller than 5`);
    });
  });

  describe('clientOptions.checkAddress', () => {
    it('should check non-ip hostname', async () => {
      let count = 0;
      const httpclient = new HttpClient({
        checkAddress() {
          count++;
          if (count === 1) return false;
          return true;
        },
      });
      
      await assert.rejects(async () => {
        await httpclient.request(_url);
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, -1);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, 'localhost');
        assert.equal(typeof err.ip, 'string');
        assert(err.family === 4 || err.family === 6);
        return true;
      });

      const response = await httpclient.request(_url);
      assert.equal(response.status, 200);
    });

    it('should check non-ip hostname with custom lookup', async () => {
      let count = 0;
      let lookupCallCounter = 0;
      const httpclient = new HttpClient({
        lookup(...args) {
          lookupCallCounter++;
          setTimeout(() => {
            dns.lookup(...args);
          }, 100);
        },
        checkAddress() {
          count++;
          if (count === 1) return false;
          return true;
        },
      });
      
      await assert.rejects(async () => {
        await httpclient.request(_url);
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, -1);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, 'localhost');
        assert.equal(typeof err.ip, 'string');
        assert(err.family === 4 || err.family === 6);
        return true;
      });
      assert.equal(lookupCallCounter, 1);

      const response = await httpclient.request(_url);
      assert.equal(response.status, 200);
    });

    it('should check ip hostname', async () => {
      let count = 0;
      const httpclient = new HttpClient({
        checkAddress() {
          count++;
          if (count === 1) return false;
          return true;
        },
      });

      await assert.rejects(async () => {
        await httpclient.request(_url.replace('localhost', '127.0.0.1'));
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, -1);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, '127.0.0.1');
        assert.equal(err.ip, '127.0.0.1');
        assert(err.family === 4);
        return true;
      });

      const response = await httpclient.request(_url.replace('localhost', '127.0.0.1'));
      assert.equal(response.status, 200);
    });

    it('should throw error when request address is ip v6', async () => {
      const httpclient = new HttpClient({
        checkAddress(address, family) {
          return family !== 6;
        },
      });

      await assert.rejects(async () => {
        await httpclient.request('http://[::1]/foo/bar');
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, '::1');
        assert.equal(err.ip, '::1');
        assert(err.family === 6);
        return true;
      });

      await assert.rejects(async () => {
        await httpclient.request('http://[2001:0DB8:02de::0e13]/foo/bar');
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, -1);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, '2001:db8:2de::e13');
        assert.equal(err.ip, '2001:db8:2de::e13');
        assert(err.family === 6);
        return true;
      });

      await assert.rejects(async () => {
        await httpclient.request('http://[2001:0DB8:02de:0000:0000:0000:0000:0e13]/foo/bar');
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.res.status, -1);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, '2001:db8:2de::e13');
        assert.equal(err.ip, '2001:db8:2de::e13');
        assert(err.family === 6);
        return true;
      });
    });

    it('should throw error when follow redirect and redirect address illegal', async () => {
      const httpclient = new HttpClient({
        checkAddress(address) {
          return address !== '127.0.0.1';
        },
      });

      await assert.rejects(async () => {
        await httpclient.request(`${_url}redirect-to-ip`);
      }, (err: any) => {
        console.error(err);
        assert.equal(err.name, 'IllegalAddressError');
        assert.equal(err.message, 'illegal address');
        assert.equal(err.hostname, 'localhost');
        assert.equal(err.ip, '127.0.0.1');
        assert(err.family === 4);
        return true;
      });
    });
  });
});
