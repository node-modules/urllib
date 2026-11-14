import { strict as assert } from 'node:assert';
import { Readable } from 'node:stream';
import { describe, it, beforeAll, afterAll, vi } from 'vitest';
import { startServer } from './fixtures/server';

describe.each([ 'Undici', 'Node 14 fallback' ])('multipart escaping with %s', encoder => {
  let request: typeof import('../src').request;
  let close: () => Promise<void>;
  let url: string;

  beforeAll(async () => {
    vi.resetModules();
    if (encoder === 'Node 14 fallback') {
      vi.doMock('undici', async () => ({
        ...await vi.importActual<typeof import('undici')>('undici'),
        FormData: undefined,
      }));
    }
    ({ request } = await import('../src'));
    const server = await startServer();
    close = server.closeServer;
    url = `${server.url}raw`;
  });

  afterAll(async () => {
    vi.doUnmock('undici');
    vi.resetModules();
    await close();
  });

  it.each([ 'buffer', 'readable', 'stream path' ])('escapes filenames from %s', async source => {
    const filename = 'evil.txt"\r\nX-Injected: smuggled\r\nContent-Disposition: form-data; name="ghost';
    const escaped = 'evil.txt%22%0D%0AX-Injected: smuggled%0D%0AContent-Disposition: form-data; name=%22ghost';
    const value = source === 'buffer' ? Buffer.from('data') : Readable.from([ Buffer.from('data') ]);
    const files = source === 'stream path' ? Object.assign(value, { path: filename }) : { [filename]: value };
    const response = await request(url, { files, dataType: 'text' });
    const field = source === 'stream path' ? 'file' : escaped;
    assert.equal(response.status, 200);
    assert.ok(response.data.includes(`Content-Disposition: form-data; name="${field}"; filename="${escaped}"\r\n`));
    assert.doesNotMatch(response.data, /\r\nX-Injected:/);
    assert.equal(response.data.match(/\r\nContent-Disposition:/g)?.length, 1);
  });

  it('escapes normal field names without changing their values', async () => {
    const response = await request(url, {
      files: Buffer.from('data'),
      data: { 'field"\r\nX-Injected: value': 'unchanged\r\nvalue' },
      dataType: 'text',
    });
    assert.ok(response.data.includes('name="field%22%0D%0AX-Injected: value"\r\n'));
    assert.ok(response.data.includes('\r\n\r\nunchanged\r\nvalue\r\n'));
    assert.doesNotMatch(response.data, /\r\nX-Injected:/);
  });

  it('preserves Unicode filenames without adding filename*', async () => {
    const response = await request(url, { files: { '中文.txt': Buffer.from('data') }, dataType: 'text' });
    assert.ok(response.data.includes('filename="中文.txt"\r\n'));
    assert.doesNotMatch(response.data, /filename\*/);
  });
});
