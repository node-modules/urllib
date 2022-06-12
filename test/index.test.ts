import assert from 'assert';
import urllib from '../src';

describe('index.test.ts', () => {
  describe('urllib.request()', () => {
    it('should work', async () => {
      const response = await urllib.request('https://www.npmjs.com', {
        timeout: [ 1, 10000 ],
      });
      assert.equal(response.status, 200);
      assert.equal(response.headers['content-type'], 'text/html');
      assert(response.headers.date);
      assert.equal(response.url, 'https://www.npmjs.com/');
    });

    it('should request not exists network error', async () => {
      await assert.rejects(async () => {
        await urllib.request('https://www.npmjs-not-exists.com');
      }, (err: any) => {
        // console.error(err);
        assert.equal(err.name, 'TypeError');
        assert.equal(err.message, 'fetch failed');
        assert.equal(err.cause.message, 'Error: getaddrinfo ENOTFOUND www.npmjs-not-exists.com');
        return true;
      });
    });
  });
});
