import { strict as assert } from 'node:assert';
import { createReadStream } from 'node:fs';
import { basename } from 'node:path';

import { describe, it, beforeAll, afterAll } from 'vitest';

import { HttpClient, WebFormData } from '../src/index.js';
import { BufferStream } from './fixtures/BufferStream.js';
import { startServer } from './fixtures/server.js';

describe('formData-with-BufferStream.test.ts', () => {
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

  it('should post with BufferStream', async () => {
    const fileStream = createReadStream(__filename);
    const bufferStream = new BufferStream();
    fileStream.pipe(bufferStream);
    const formData = new WebFormData();
    const fileName = basename(__filename);
    formData.append('fileBufferStream', bufferStream, fileName);
    formData.append('foo', 'bar');

    const httpClient = new HttpClient();
    const response = await httpClient.request(`${_url}multipart`, {
      method: 'POST',
      content: formData,
      headers: formData.getHeaders(),
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.files.fileBufferStream.filename, 'formData-with-BufferStream.test.ts');
    assert.deepEqual(response.data.form, { foo: 'bar' });
  });
});
