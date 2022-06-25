import { strict as assert } from 'assert';
import urllib from '../src';
import { startServer } from './fixtures/server';

describe('options.retry.test.ts', () => {
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

  it('should retry fail on default server status 500', async () => {
    let response = await urllib.request(`${_url}mock-status?status=500`, {
      dataType: 'text',
      retry: 2,
    });
    assert.equal(response.status, 500);
    assert.equal(response.data, 'Mock status 500');
    assert.equal(response.headers['x-requests-persocket'], '1');
    // console.log(response.headers);

    response = await urllib.request(`${_url}mock-status?status=500`, {
      dataType: 'text',
      retry: 2,
    });
    assert.equal(response.status, 500);
    assert.equal(response.data, 'Mock status 500');
    assert.equal(response.headers['x-requests-persocket'], '1');
    // console.log(response.headers);

    response = await urllib.request(`${_url}mock-status?status=500`, {
      dataType: 'text',
      retry: 2,
    });
    assert.equal(response.status, 500);
    assert.equal(response.data, 'Mock status 500');
    assert.equal(response.headers['x-requests-persocket'], '2');
    // console.log(response.headers);
  });
});
