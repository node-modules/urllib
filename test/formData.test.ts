import { strict as assert } from 'node:assert';

import { describe, it } from 'vite-plus/test';

import { WebFormData } from '../src/index.js';

describe('formData.test.ts', () => {
  it.each([
    ['plain.txt', 'filename="plain.txt"'],
    ['a"b".txt', 'filename="a%22b%22.txt"'],
    ['a\rb\r.txt', 'filename="a%0Db%0D.txt"'],
    ['a\nb\n.txt', 'filename="a%0Ab%0A.txt"'],
    ['a\r\nb.txt', 'filename="a%0D%0Ab.txt"'],
    ['a%22.txt', 'filename="a%22.txt"'],
    ['中文.txt', 'filename="中文.txt"; filename*=UTF-8\'\'%E4%B8%AD%E6%96%87.txt'],
    ['中"\r\n.txt', 'filename="中%22%0D%0A.txt"; filename*=UTF-8\'\'%E4%B8%AD%22%0D%0A.txt'],
  ])('should safely serialize filename %j', (filename, disposition) => {
    const form = new WebFormData();
    form.append('file', Buffer.from('data'), { filename, contentType: 'text/plain' });
    assert.equal(
      form.getBuffer().toString(),
      `--${form.getBoundary()}\r\nContent-Disposition: form-data; name="file"; ${disposition}\r\n` +
        `Content-Type: text/plain\r\n\r\ndata\r\n--${form.getBoundary()}--\r\n`,
    );
  });

  it('should escape a custom filepath after normalization', () => {
    const form = new WebFormData();
    form.append('file', Buffer.from('data'), { filepath: 'folder/a"\r\n.txt' });
    assert.ok(form.getBuffer().toString().includes('filename="folder/a%22%0D%0A.txt"\r\n'));
  });
});
