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

  it('should throw error when request headers contain non ascii', async () => {
    await assert.rejects(async () => {
      const response = await urllib.request(_url, {
        headers: { 'x-test': '中文' },
        dataType: 'json',
      });
      console.log(response);
    }, (err: any) => {
      // console.error(err);
      assert.equal(err.name, 'InvalidArgumentError');
      assert.equal(err.message, 'invalid x-test header');
      assert.equal(err.code, 'UND_ERR_INVALID_ARG');
      assert(err.res);
      assert.equal(err.res.status, -1);
      return true;
    });
  });
});
