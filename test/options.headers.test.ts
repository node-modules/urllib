import { strict as assert } from 'node:assert';
import { describe, it, beforeAll, afterAll } from 'vitest';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.headers.test.ts', () => {
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

  it('should auto set default user-agent and accept request headers', async () => {
    const { status, headers, data } = await urllib.request(_url, {
      dataType: 'json',
      headers: {
        'X-Upper-Case': 'orginal value',
      },
      timeout: [],
    });
    assert.equal(status, 200);
    assert.equal(headers['x-foo'], 'bar');
    assert.match(data.headers['user-agent'], /node-urllib\/3\.0\.0 Node\.js\//);
    assert.equal(data.headers['accept-encoding'], undefined);
    assert.equal(data.headers.connection, 'keep-alive');
    assert.equal(data.headers.accept, 'application/json');
    assert.equal(data.headers['x-upper-case'], 'orginal value');
  });

  it('should send lower case by default', async () => {
    const response = await urllib.request(_url, {
      headers: {
        'Case-Key': 'case1',
        'CASE-KEY': 'case2',
        // 'CASE-KEy': 'case3,case33',
        'lower-key': 'lower',
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    assert.equal(response.data.headers['case-key'], 'case2');
    // assert.equal(response.data.headers['case-key'], 'case1, case2, case3,case33');
    assert.equal(response.data.headers['lower-key'], 'lower');
    assert.equal(response.data.headers['Case-key'], undefined);
    assert.equal(response.data.headers['CASE-KEY'], undefined);
  });

  it('should ignore undefined value and convert null value to empty string', async () => {
    const response = await urllib.request(_url, {
      headers: {
        'null-header': null as any,
        'undefined-header': undefined,
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data.headers);
    assert.equal(response.data.headers['null-header'], '');
    assert.equal(response.data.headers['undefined-header'], undefined);
  });
});
