import {
  curl,
  request,
  requestWithCallback,
  requestThunk,
  HttpClient,
  HttpClient2,
} from '../../lib';
import * as http from 'http';
import * as assert from 'assert';

describe('typescript', () => {
  const url = 'http://127.0.0.1:12345';
  let server;
  before(function(done) {
    server = http.createServer(function(req, res) {
      if (req.url === '/json') {
        res.write(JSON.stringify({ a: 1 }));
      } else {
        res.write('done');
      }
      res.statusCode = 200;
      res.end();
    });
    server.listen(12345, done);
  });
  after(function(done) {
    server.close(done);
  });

  it('curl', async () => {
    const res = await curl<Buffer>(url, {
      method: 'POST',
      headers: {
        'context-type': 'application/json',
        'x-custom': 'custom',
      },
    });
    assert(res.data.toString() === 'done');
    assert(res.status === 200);
    assert(!res.headers['x-custom']);
  });

  describe('HttpClient', function() {
    let httpclient: HttpClient;
    before(() => {
      httpclient = new HttpClient();
    });
    it('request return promise', async () => {
      const res = await httpclient.request<Buffer>(url);
      assert(res.data.toString() === 'done');
      assert(res.status === 200);
    });

    it('request return promise with options', async () => {
      const res = await httpclient.request<Buffer>(url, { method: 'POST' });
      assert(res.data.toString() === 'done');
      assert(res.status === 200);
    });

    it('request with callback', done => {
      httpclient.request<Buffer>(url, function(err, data, res) {
        assert(data.toString() === 'done');
        assert(res.statusCode === 200);
        done(err);
      });
    });

    it('request with callback and options', done => {
      httpclient.request<Buffer>(url, { method: 'POST' }, function(err, data, res) {
        assert(data.toString() === 'done');
        assert(res.statusCode === 200);
        done(err);
      });
    });

    it('request without generic', async () => {
      const res = await httpclient.request(url + '/json', { dataType: 'json' });
      assert(res.data.a === 1);
      assert(res.status === 200);
    });
  });

  describe('HttpClient2', function() {
    let httpclient: HttpClient2;
    before(() => {
      httpclient = new HttpClient2();
    });
    it('request return promise', async () => {
      const res = await httpclient.request<Buffer>(url, {
        retry: 1,
        isRetry(res) {
          return res.status === 500;
        },
      });
      assert(res.data.toString() === 'done');
      assert(res.status === 200);
    });
  });

  describe('request', function() {
    it('request return promise', async () => {
      const res = await request<Buffer>(url);
      assert(res.data.toString() === 'done');
      assert(res.status === 200);
    });

    it('request return promise with options', async () => {
      const res = await request<Buffer>(url, { method: 'POST' });
      assert(res.data.toString() === 'done');
      assert(res.status === 200);
    });

    it('request return promise with `files` options', async ()=>{
      const res = await request(url, { files: Buffer.from('mock file content') });
      assert(res.data.toString() === 'done')
      assert(res.status === 200)
    });

    it('request with callback', done => {
      request<Buffer>(url, function(err, data, res) {
        assert(data.toString() === 'done');
        assert(res.statusCode === 200);
        done(err);
      });
    });

    it('request with callback and options', done => {
      request<Buffer>(url, { method: 'POST' }, function(err, data, res) {
        assert(data.toString() === 'done');
        assert(res.statusCode === 200);
        done(err);
      });
    });
  });

  describe('requestWithCallback', function() {
    it('requestWithCallback', async () => {
      const res = await requestWithCallback<Buffer>(url, function(err, data, res) {
        assert(data.toString() === 'done');
        assert(res.statusCode === 200);
      });
    });

    it('requestWithCallback with options', async () => {
      const res = await requestWithCallback<Buffer>(url, { method: 'POST' }, function(err, data, res) {
        assert(data.toString() === 'done');
        assert(res.statusCode === 200);
      });
    });
  });

  describe('requestThunk', function() {
    it('requestThunk', async () => {
      const res = await requestThunk<Buffer>(url)(function(err, data, res) {
        assert(data.toString() === 'done');
        assert(res.statusCode === 200);
      });
    });

    it('requestThunk with options', async () => {
      const res = await requestThunk<Buffer>(url, { method: 'POST' })(function(err, data, res) {
        assert(data.toString() === 'done');
        assert(res.statusCode === 200);
      });
    });
  });
});
