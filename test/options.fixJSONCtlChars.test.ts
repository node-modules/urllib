import { strict as assert } from 'assert';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.fixJSONCtlChars.test.ts', () => {
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

  it('should auto fix json control characters when fixJSONCtlChars = true', async () => {
    const response = await urllib.request(`${_url}json_with_controls_unicode`, {
      dataType: 'json',
      fixJSONCtlChars: true,
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.deepEqual(response.data, {
      foo: '\b\f\n\r\tbar\u000e!1!\u0086!2\!\u0000\!3\!\u001f\!4\!\\\!5\!end\\\\',
    });
  });

  it('should throw error when json control characters exists', async () => {
    await assert.rejects(async () => {
      await urllib.request(`${_url}json_with_controls_unicode`, {
        dataType: 'json',
      });
    }, (err: any) => {
      assert.equal(err.name, 'JSONResponseFormatError');
      // console.error(err);
      assert.match(err.message, /Unexpected token/);
      assert.equal(err.status, 200);
      assert.equal(err.headers['x-method'], 'GET');
      return true;
    });
  });

  it('should fix json string with custom function', async () => {
    const response = await urllib.request(`${_url}json_with_t`, {
      dataType: 'json',
      fixJSONCtlChars(str) {
        return str.replace(/\t/g, '\\t');
      },
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.deepEqual(response.data, {
      foo: 'ba\tr\t\t',
    });
  });
});
