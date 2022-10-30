import { describe, it, beforeAll, afterAll } from 'vitest';
import { strict as assert } from 'assert';
import urllib from '../src';
import { startServer } from './fixtures/socket_server';
import { createServer } from 'http';
import os from 'os';


describe('options.socketPath.test.ts', () => {
  if (os.platform() === 'win32') {
    return;
  }

  let close: any;
  let _url: string;
  let _socketPath: string;
  beforeAll(async () => {
    const { url, closeServer, socketPath } = await startServer();
    close = closeServer;
    _url = url;
    _socketPath = socketPath;

  });

  afterAll(async () => {
    await close();
  });

  it('should request socket successfully', async () => {
    const result = await urllib.request(_url, {
      socketPath: _socketPath,
      contentType: 'json',
      dataType: 'json',
    });

    assert.deepStrictEqual(result.data, {a: 1});
  });
});
