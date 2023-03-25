import { strict as assert } from 'node:assert';
import os from 'node:os';
import { describe, it, beforeAll, afterAll } from 'vitest';
import urllib from '../src';
import { startServer } from './fixtures/socket_server';

describe.skipIf(os.platform() === 'win32')('options.socketPath.test.ts', () => {
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
    await close?.();
  });

  it('should request socket successfully', async () => {
    const result = await urllib.request(_url, {
      socketPath: _socketPath,
      contentType: 'json',
      dataType: 'json',
    });

    assert.deepStrictEqual(result.data, { a: 1 });
  });
});

