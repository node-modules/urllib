import { strict as assert } from 'assert';
import urllib from '../src';
import { startServer } from './fixtures/server';

// https://github.com/node-modules/urllib/issues/198
describe('non-ascii-request-header.test.ts', () => {
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

  it.skip('should error when request headers contain non ascii', async () => {
    await assert.rejects(async () => {
      const r = await urllib.request(_url, {
        headers: { 'x-test': '中文' },
        dataType: 'json',
      });
      console.log(r);
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'TypeError');
      assert.equal(err.message, 'Invalid character in header content ["x-test"]');
      assert.equal(err.code, 'ERR_INVALID_CHAR');
      assert(err.res);
      assert.equal(err.res.status, -1);
      return true;
    });
  });

  it('should ignore request headers contain non ascii', async () => {
    const response = await urllib.request(_url, {
      headers: { 'x-test': '中文' },
      dataType: 'json',
    });
    // console.log(response);
    assert.equal(response.status, 200);
    assert.equal(response.data.headers['x-test'], '-\x87');
  });
});
