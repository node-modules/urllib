import { strict as assert } from 'node:assert';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

import { describe, it, beforeAll, afterAll } from 'vite-plus/test';

import urllib from '../src/index.js';
import { startServer } from './fixtures/server.js';

describe('options.files.test.ts', () => {
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

  it('should upload a file with filepath success with default POST method', async () => {
    const file = path.join(__dirname, 'cjs', 'index.js');
    const stat = await fs.stat(file);
    const response = await urllib.request(`${_url}multipart`, {
      files: file,
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'POST');
    assert.match(response.data.headers['content-type'], /^multipart\/form-data;/);
    assert.equal(response.data.files.file.filename, 'index.js');
    assert.equal(response.data.files.file.mimeType, 'application/javascript');
    assert.equal(response.data.files.file.size, stat.size);
  });

  it('should upload not exists file throw error', async () => {
    const file = path.join(__dirname, 'cjs', 'index.js-not-exists');
    await assert.rejects(
      async () => {
        await urllib.request(`${_url}multipart`, {
          files: [file],
          dataType: 'json',
        });
      },
      (err: any) => {
        assert.equal(err.code, 'ENOENT');
        assert.equal(err.res.status, -1);
        assert.equal(err.status, -1);
        return true;
      },
    );
  });

  it('should upload files = [filepath] success with default POST method', async () => {
    const file = path.join(__dirname, 'cjs', 'index.js');
    const stat = await fs.stat(file);
    const response = await urllib.request(`${_url}multipart`, {
      files: [file],
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'POST');
    assert.match(response.data.headers['content-type'], /^multipart\/form-data;/);
    assert.equal(response.data.files.file.filename, 'index.js');
    assert.equal(response.data.files.file.mimeType, 'application/javascript');
    assert.equal(response.data.files.file.size, stat.size);
  });

  it('should upload multi files: Array<string> success with default POST method', async () => {
    const file = path.join(__dirname, 'cjs', 'index.js');
    const json = path.join(__dirname, '..', 'package.json');
    const stat = await fs.stat(file);
    const jsonStat = await fs.stat(json);
    const response = await urllib.request(`${_url}multipart`, {
      files: [file, json],
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'POST');
    assert.match(response.data.headers['content-type'], /^multipart\/form-data;/);
    assert.equal(response.data.files.file.filename, 'index.js');
    assert.equal(response.data.files.file.mimeType, 'application/javascript');
    assert.equal(response.data.files.file.size, stat.size);
    assert.equal(response.data.files.file1.filename, 'package.json');
    assert.equal(response.data.files.file1.mimeType, 'application/json');
    assert.equal(response.data.files.file1.size, jsonStat.size);
  });

  it('should upload multi files: Record<field, string> success with default POST method', async () => {
    const file = path.join(__dirname, 'cjs', 'index.js');
    // const txt = path.join(__dirname, 'fixtures', '😄foo😭.txt');
    const txt = path.join(__dirname, 'fixtures', 'foo.txt');
    const json = path.join(__dirname, '..', 'package.json');
    const stat = await fs.stat(file);
    const jsonStat = await fs.stat(json);
    const txtStat = await fs.stat(txt);
    const response = await urllib.request(`${_url}multipart`, {
      files: {
        file,
        // '😄foo😭.js': txt,
        'foo.js': txt,
        json,
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'POST');
    assert.match(response.data.headers['content-type'], /^multipart\/form-data;/);
    // assert.equal(response.data.files['ð\x9F\x98\x84fooð\x9F\x98­.js'].filename, 'ð\x9F\x98\x84fooð\x9F\x98­.txt');
    // assert.equal(response.data.files['ð\x9F\x98\x84fooð\x9F\x98­.js'].mimeType, 'text/plain');
    // assert.equal(response.data.files['ð\x9F\x98\x84fooð\x9F\x98­.js'].size, txtStat.size);
    assert.equal(response.data.files['foo.js'].filename, 'foo.txt');
    assert.equal(response.data.files['foo.js'].mimeType, 'text/plain');
    assert.equal(response.data.files['foo.js'].size, txtStat.size);
    assert.equal(response.data.files.file.filename, 'index.js');
    assert.equal(response.data.files.file.mimeType, 'application/javascript');
    assert.equal(response.data.files.file.size, stat.size);
    assert.equal(response.data.files.json.filename, 'package.json');
    assert.equal(response.data.files.json.mimeType, 'application/json');
    assert.equal(response.data.files.json.size, jsonStat.size);
  });

  it('should upload files as object success with default POST method', async () => {
    const files: object = {
      hello: Buffer.from('😄foo😭'),
    };
    const response = await urllib.request(`${_url}multipart`, {
      files,
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'POST');
    assert.match(response.data.headers['content-type'], /^multipart\/form-data;/);
    assert.equal(response.data.files.hello.filename, 'hello');
    assert.equal(response.data.files.hello.mimeType, 'application/octet-stream');
    assert.equal(response.data.files.hello.encoding, '7bit');
    assert.equal(response.data.files.hello.size, 11);
  });

  it('should upload a file with stream success', async () => {
    const file = path.join(__dirname, 'cjs', 'index.js');
    const stat = await fs.stat(file);
    const response = await urllib.request(`${_url}multipart`, {
      files: createReadStream(file),
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'POST');
    assert.match(response.data.headers['content-type'], /^multipart\/form-data;/);
    assert.equal(response.data.files.file.filename, 'index.js');
    assert.equal(response.data.files.file.mimeType, 'application/javascript');
    assert.equal(response.data.files.file.size, stat.size);
  });

  it('should upload a file with buffer success', async () => {
    const stat = await fs.stat(__filename);
    const response = await urllib.request(`${_url}multipart`, {
      files: await fs.readFile(__filename),
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'POST');
    assert.match(response.data.headers['content-type'], /^multipart\/form-data;/);
    assert.equal(response.data.files.file.filename, 'bufferfile0');
    assert.equal(response.data.files.file.mimeType, 'application/octet-stream');
    assert.equal(response.data.files.file.size, stat.size);
  });

  it('should upload a file with buffers success', async () => {
    const stat = await fs.stat(__filename);
    const buffer = await fs.readFile(__filename);
    const response = await urllib.request(`${_url}multipart`, {
      method: 'PUT',
      files: [buffer, buffer],
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'PUT');
    assert.match(response.data.headers['content-type'], /^multipart\/form-data;/);
    assert.equal(response.data.files.file.filename, 'bufferfile0');
    assert.equal(response.data.files.file.mimeType, 'application/octet-stream');
    assert.equal(response.data.files.file.size, stat.size);
    assert.equal(response.data.files.file1.filename, 'bufferfile1');
    assert.equal(response.data.files.file1.mimeType, 'application/octet-stream');
    assert.equal(response.data.files.file1.size, stat.size);
  });

  it('should upload multi file with Array<String|Buffer|Stream> success', async () => {
    const stat = await fs.stat(__filename);
    const buffer = await fs.readFile(__filename);
    const content = Buffer.from('Stream content');
    const stream = new Readable({
      read() {
        this.push(content);
        this.push(null);
      },
    });

    const response = await urllib.request(`${_url}multipart`, {
      method: 'GET',
      files: [__filename, createReadStream(__filename), buffer, stream],
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'POST');
    assert.match(response.data.headers['content-type'], /^multipart\/form-data;/);
    assert.equal(response.data.files.file.filename, 'options.files.test.ts');
    assert.equal(response.data.files.file.mimeType, 'video/mp2t');
    assert.equal(response.data.files.file.size, stat.size);
    assert.equal(response.data.files.file1.filename, 'options.files.test.ts');
    assert.equal(response.data.files.file1.mimeType, 'video/mp2t');
    assert.equal(response.data.files.file1.size, stat.size);
    assert.equal(response.data.files.file2.filename, 'bufferfile2');
    assert.equal(response.data.files.file2.mimeType, 'application/octet-stream');
    assert.equal(response.data.files.file2.size, stat.size);
    assert.equal(response.data.files.file3.filename, 'streamfile3');
    assert.equal(response.data.files.file3.mimeType, 'application/octet-stream');
    assert.equal(response.data.files.file3.size, 14);
  });

  it('should upload a file with args.data success', async () => {
    const stat = await fs.stat(__filename);
    const largeFormValue = await fs.readFile(__filename, 'utf-8');
    const txtEmoji = path.join(__dirname, 'fixtures', '😄foo😭.txt');
    const txtEmojiStat = await fs.stat(txtEmoji);
    const txt = path.join(__dirname, 'fixtures', 'foo.txt');
    const txtValue = await fs.readFile(txt, 'utf-8');
    const response = await urllib.request(`${_url}multipart`, {
      method: 'HEAD',
      files: [__filename, txtEmoji],
      data: {
        hello: 'hello world，😄😓',
        // \r\n => \n, should encodeURIComponent first
        large: encodeURIComponent(largeFormValue),
        txtValue: encodeURIComponent(txtValue),
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'POST');
    assert.match(response.data.headers['content-type'], /^multipart\/form-data;/);
    assert.equal(response.data.files.file.filename, 'options.files.test.ts');
    assert.equal(response.data.files.file.mimeType, 'video/mp2t');
    assert.equal(response.data.files.file.size, stat.size);
    assert.equal(response.data.files.file1.filename, '😄foo😭.txt');
    assert.equal(response.data.files.file1.mimeType, 'text/plain');
    assert.equal(response.data.files.file1.size, txtEmojiStat.size);
    assert.equal(response.data.form.hello, 'hello world，😄😓');
    assert.equal(JSON.stringify(decodeURIComponent(response.data.form.txtValue)), JSON.stringify(txtValue));
    assert.equal(decodeURIComponent(response.data.form.txtValue), txtValue);
    assert.equal(decodeURIComponent(response.data.form.large), largeFormValue);
  });

  it('should upload same field name between files and data', async () => {
    const stat = await fs.stat(__filename);
    const response = await urllib.request(`${_url}multipart`, {
      files: {
        uploadfile: __filename,
        foo: createReadStream(__filename),
      },
      data: {
        hello: 'hello world，😄😓',
        foo: 'bar',
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'POST');
    assert.match(response.data.headers['content-type'], /^multipart\/form-data;/);
    assert.equal(response.data.files.uploadfile.filename, 'options.files.test.ts');
    assert.equal(response.data.files.uploadfile.mimeType, 'video/mp2t');
    assert.equal(response.data.files.uploadfile.size, stat.size);
    assert.equal(response.data.files.foo.filename, 'options.files.test.ts');
    assert.equal(response.data.files.foo.mimeType, 'video/mp2t');
    assert.equal(response.data.files.foo.size, stat.size);
    assert.equal(response.data.form.hello, 'hello world，😄😓');
    assert.equal(response.data.form.foo, 'bar');
  });

  it('should support custom fileName when use files:object', async () => {
    const rawData = JSON.stringify({ a: 1 });
    const response = await urllib.request(`${_url}multipart`, {
      files: {
        'buffer.js': Buffer.from(rawData),
        // Readable.from data must be Buffer or Bytes
        'readable.js': Readable.from([Buffer.from(rawData)]),
      },
      data: {
        hello: 'hello world，😄😓',
        foo: 'bar',
      },
      dataType: 'json',
    });
    assert.equal(response.status, 200);
    // console.log(response.data);
    assert.equal(response.data.method, 'POST');
    assert.match(response.data.headers['content-type'], /^multipart\/form-data;/);

    assert.equal(response.data.files['readable.js'].filename, 'readable.js');
    // set mimeType by filename
    assert.equal(response.data.files['readable.js'].mimeType, 'application/javascript');

    assert.equal(response.data.files['buffer.js'].filename, 'buffer.js');
    assert.equal(response.data.files['buffer.js'].mimeType, 'application/javascript');
    assert.equal(response.data.files['buffer.js'].size, rawData.length);

    assert.equal(response.data.form.hello, 'hello world，😄😓');
    assert.equal(response.data.form.foo, 'bar');
  });
});
