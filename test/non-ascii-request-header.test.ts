import assert from 'assert';
import urllib from '../src';
import { startServer } from './fixtures/server';

// https://github.com/node-modules/urllib/issues/198
describe('non-ascii-request-header.test.ts', () => {
  let _server: any;
  let _url: string;
  beforeAll(async () => {
    const { server, url } = await startServer();
    _server = server;
    _url = url;
  });

  afterAll(() => {
    _server.closeAllConnections && _server.closeAllConnections();
    _server.close();
  });

  it('should error when request headers contain non ascii', async () => {
    await assert.rejects(async () => {
      await urllib.request(_url, {
        headers: { 'x-test': '中文' },
      });
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'TypeError');
      assert.equal(err.message, 'Invalid character in header content ["x-test"]');
      assert.equal(err.code, 'ERR_INVALID_CHAR');
      assert(err.res);
      assert(err.res.status === -1);
      return true;
    });
  });
});
