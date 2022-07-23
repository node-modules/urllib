# urllib

[![NPM version][npm-image]][npm-url]
[![Node.js CI](https://github.com/node-modules/urllib/actions/workflows/nodejs.yml/badge.svg)](https://github.com/node-modules/urllib/actions/workflows/nodejs.yml)
[![Test coverage][codecov-image]][codecov-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/urllib.svg?style=flat-square
[npm-url]: https://npmjs.org/package/urllib
[codecov-image]: https://codecov.io/gh/node-modules/urllib/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/node-modules/urllib
[snyk-image]: https://snyk.io/test/npm/urllib/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/urllib
[download-image]: https://img.shields.io/npm/dm/urllib.svg?style=flat-square
[download-url]: https://npmjs.org/package/urllib

Request HTTP URLs in a complex world — basic
and digest authentication, redirections, cookies, timeout and more.

## Install

```bash
npm install urllib --save
```

## Usage

### TypeScript and ESM

```js
import { request } from 'urllib';

const { data, res } = await request('http://cnodejs.org/');
// result: { data: Buffer, res: Response }
console.log('status: %s, body size: %d, headers: %j', res.statusCode, data.length, res.headers);
```

### CommonJS

```js
const { request } = require('urllib');

const { data, res } = await request('http://cnodejs.org/');
// result: { data: Buffer, res: Response }
console.log('status: %s, body size: %d, headers: %j', res.statusCode, data.length, res.headers);
```

## Global `response` event

You should create a urllib instance first.

```js
import { HttpClient } from 'urllib';

const httpclient = new HttpClient();
httpclient.on('response', (info) => {
  error: err,
  ctx: args.ctx,
  req: {
    url: url,
    options: options,
    size: requestSize,
  },
  res: res
});

const { data, res } = await httpclient.request('https://nodejs.org');
console.log('status: %s, body size: %d, headers: %j', res.statusCode, data.length, res.headers);
```

## API Doc

### Method: `async request(url[, options])`

#### Arguments

- **url** String | Object - The URL to request, either a String or a Object that return by [url.parse](https://nodejs.org/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost).
- ***options*** Object - Optional
  - ***method*** String - Request method, defaults to `GET`. Could be `GET`, `POST`, `DELETE` or `PUT`. Alias 'type'.
  - ***data*** Object - Data to be sent. Will be stringify automatically.
  - ***content*** String | [Buffer](https://nodejs.org/api/buffer.html) - Manually set the content of payload. If set, `data` will be ignored.
  - ***stream*** [stream.Readable](https://nodejs.org/api/stream.html#stream_class_stream_readable) - Stream to be pipe to the remote. If set, `data` and `content` will be ignored.
  - ***writeStream*** [stream.Writable](https://nodejs.org/api/stream.html#stream_class_stream_writable) - A writable stream to be piped by the response stream. Responding data will be write to this stream and `callback` will be called with `data` set `null` after finished writing.
  - ***files*** {Array<ReadStream|Buffer|String> | Object | ReadStream | Buffer | String - The files will send with `multipart/form-data` format, base on `formstream`. If `method` not set, will use `POST` method by default.
  - ***contentType*** String - Type of request data. Could be `json` (**Notes**: not use `application/json` here). If it's `json`, will auto set `Content-Type: application/json` header.
  - ***dataType*** String - Type of response data. Could be `text` or `json`. If it's `text`, the `callback`ed `data` would be a String. If it's `json`, the `data` of callback would be a parsed JSON Object and will auto set `Accept: application/json` header. Default `callback`ed `data` would be a `Buffer`.
  - **fixJSONCtlChars** Boolean - Fix the control characters (U+0000 through U+001F) before JSON parse response. Default is `false`.
  - ***headers*** Object - Request headers.
  - ***timeout*** Number | Array - Request timeout in milliseconds for connecting phase and response receiving phase. Defaults to `exports.TIMEOUT`, both are 5s. You can use `timeout: 5000` to tell urllib use same timeout on two phase or set them seperately such as `timeout: [3000, 5000]`, which will set connecting timeout to 3s and response 5s.
  - ***auth*** String - `username:password` used in HTTP Basic Authorization.
  - ***digestAuth*** String - `username:password` used in HTTP [Digest Authorization](https://en.wikipedia.org/wiki/Digest_access_authentication).
  - ***agent*** [http.Agent](https://nodejs.org/api/http.html#http_class_http_agent) - HTTP Agent object.
      Set `false` if you does not use agent.
  - ***httpsAgent*** [https.Agent](https://nodejs.org/api/https.html#https_class_https_agent) - HTTPS Agent object.
      Set `false` if you does not use agent.
  - ***followRedirect*** Boolean - follow HTTP 3xx responses as redirects. defaults to false.
  - ***maxRedirects*** Number - The maximum number of redirects to follow, defaults to 10.
  - ***formatRedirectUrl*** Function - Format the redirect url by your self. Default is `url.resolve(from, to)`.
  - ***beforeRequest*** Function - Before request hook, you can change every thing here.
  - ***streaming*** Boolean - let you get the `res` object when request  connected, default `false`. alias `customResponse`
  - ***gzip*** Boolean - Accept `gzip, br` response content and auto decode it, default is `false`.
  - ***timing*** Boolean - Enable timing or not, default is `false`.

#### Options: `options.data`

When making a request:

```js
await request('https://example.com', {
  method: 'GET',
  data: {
    'a': 'hello',
    'b': 'world',
  }
});
```

For `GET` request, `data` will be stringify to query string, e.g. `http://example.com/?a=hello&b=world`.

For others like `POST`, `PATCH` or `PUT` request,
in defaults, the `data` will be stringify into `application/x-www-form-urlencoded` format
if `content-type` header is not set.

If `content-type` is `application/json`, the `data` will be `JSON.stringify` to JSON data format.

#### Options: `options.content`

`options.content` is useful when you wish to construct the request body by yourself,
for example making a `content-type: application/json` request.

Notes that if you want to send a JSON body, you should stringify it yourself:

```js
await request('https://example.com', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  content: JSON.stringify({
    a: 'hello',
    b: 'world',
  })
});
```

It would make a HTTP request like:

```http
POST / HTTP/1.1
host: example.com
content-type: application/json

{
  "a": "hello",
  "b": "world"
}
```

This exmaple can use `options.data` with `application/json` content type:

```js
await request('https://example.com', {
  method: 'POST',
  headers: {
    'content-type': 'application/json'
  },
  data: {
    a: 'hello',
    b: 'world',
  }
});
```

#### Options: `options.files`

Upload a file with a `hello` field.

```js
await request('https://example.com/upload', {
  method: 'POST',
  files: __filename,
  data: {
    hello: 'hello urllib',
  },
});
```

Upload multi files with a `hello` field.

```js
await request('https://example.com/upload', {
  method: 'POST',
  files: [
    __filename,
    fs.createReadStream(__filename),
    Buffer.from('mock file content'),
  ],
  data: {
    hello: 'hello urllib with multi files',
  },
});
```

Custom file field name with `uploadfile`.

```js
await request('https://example.com/upload', {
  method: 'POST',
  files: {
    uploadfile: __filename,
  },
});
```

#### Options: `options.stream`

Uploads a file with [formstream](https://github.com/node-modules/formstream):

```js
import formstream from 'formstream';

const form = formstream();
form.file('file', __filename);
form.field('hello', '你好urllib');

await request('https://example.com/upload', {
  method: 'POST',
  headers: form.headers(),
  stream: form,
});
```

### Response Object

Response is normal object, it contains:

- `status` or `statusCode`: response status code.
  - `-1` meaning some network error like `ENOTFOUND`
  - `-2` meaning ConnectionTimeoutError
- `headers`: response http headers, default is `{}`
- `size`: response size
- `aborted`: response was aborted or not
- `rt`: total request and response time in ms.
- `timing`: timing object if timing enable.
- `remoteAddress`: http server ip address
- `remotePort`: http server ip port
- `socketHandledRequests`: socket already handled request count
- `socketHandledResponses`: socket already handled response count

## Run test with debug log

```bash
NODE_DEBUG=urllib npm test
```

## Mocking Request

export from [undici](https://undici.nodejs.org/#/docs/best-practices/mocking-request)

```ts
import { strict as assert } from 'assert';
import { MockAgent, setGlobalDispatcher, request } from 'urllib';

const mockAgent = new MockAgent();
setGlobalDispatcher(mockAgent);

const mockPool = mockAgent.get('http://localhost:7001');

mockPool.intercept({
  path: '/foo',
  method: 'POST',
}).reply(400, {
  message: 'mock 400 bad request',
});

const response = await request('http://localhost:7001/foo', {
  method: 'POST',
  dataType: 'json',
});
assert.equal(response.status, 400);
assert.deepEqual(response.data, { message: 'mock 400 bad request' });
```

## Benchmarks

Fork [undici benchmarks script](https://github.com/fengmk2/undici/blob/urllib-benchmark/benchmarks/benchmark.js)

### Connections 1

| Tests               | Samples |        Result | Tolerance | Difference with slowest |
|---------------------|---------|---------------|-----------|-------------------------|
| http - no keepalive |     15 | 6.38 req/sec | ± 2.44 % |                      - |
| http - keepalive    |     10 | 6.77 req/sec | ± 2.35 % |               + 6.13 % |
| urllib2 - request   |     45 | 40.13 req/sec | ± 2.88 % |             + 528.66 % |
| urllib3 - request   |     10 | 58.51 req/sec | ± 2.52 % |             + 816.64 % |
| undici - pipeline   |      5 | 59.12 req/sec | ± 2.47 % |             + 826.18 % |
| undici - fetch      |     15 | 60.42 req/sec | ± 3.00 % |             + 846.60 % |
| undici - dispatch   |      5 | 60.58 req/sec | ± 1.39 % |             + 848.99 % |
| undici - stream     |      5 | 61.30 req/sec | ± 1.31 % |             + 860.39 % |
| undici - request    |      5 | 61.74 req/sec | ± 2.03 % |             + 867.20 % |

### Connections 50

| Tests               | Samples |           Result | Tolerance | Difference with slowest |
|---------------------|---------|------------------|-----------|-------------------------|
| urllib2 - request   |     51 | 1465.40 req/sec | ± 14.40 % |                      - |
| undici - fetch      |     40 | 3121.10 req/sec | ± 2.82 % |             + 112.99 % |
| http - no keepalive |     45 | 3355.42 req/sec | ± 2.84 % |             + 128.98 % |
| http - keepalive    |     51 | 5179.55 req/sec | ± 36.61 % |             + 253.46 % |
| urllib3 - request   |     30 | 7045.86 req/sec | ± 2.93 % |             + 380.82 % |
| undici - pipeline   |     50 | 8306.92 req/sec | ± 2.99 % |             + 466.87 % |
| undici - request    |     51 | 9552.59 req/sec | ± 13.13 % |             + 551.88 % |
| undici - stream     |     45 | 12523.45 req/sec | ± 2.97 % |             + 754.61 % |
| undici - dispatch   |     51 | 12970.18 req/sec | ± 3.15 % |             + 785.10 % |


<!-- GITCONTRIBUTOR_START -->

## Contributors

|[<img src="https://avatars.githubusercontent.com/u/156269?v=4" width="100px;"/><br/><sub><b>fengmk2</b></sub>](https://github.com/fengmk2)<br/>|[<img src="https://avatars.githubusercontent.com/u/985607?v=4" width="100px;"/><br/><sub><b>dead-horse</b></sub>](https://github.com/dead-horse)<br/>|[<img src="https://avatars.githubusercontent.com/u/288288?v=4" width="100px;"/><br/><sub><b>xingrz</b></sub>](https://github.com/xingrz)<br/>|[<img src="https://avatars.githubusercontent.com/u/360661?v=4" width="100px;"/><br/><sub><b>popomore</b></sub>](https://github.com/popomore)<br/>|[<img src="https://avatars.githubusercontent.com/u/327019?v=4" width="100px;"/><br/><sub><b>JacksonTian</b></sub>](https://github.com/JacksonTian)<br/>|[<img src="https://avatars.githubusercontent.com/u/543405?v=4" width="100px;"/><br/><sub><b>ibigbug</b></sub>](https://github.com/ibigbug)<br/>|
| :---: | :---: | :---: | :---: | :---: | :---: |
|[<img src="https://avatars.githubusercontent.com/u/14790466?v=4" width="100px;"/><br/><sub><b>greenkeeperio-bot</b></sub>](https://github.com/greenkeeperio-bot)<br/>|[<img src="https://avatars.githubusercontent.com/u/227713?v=4" width="100px;"/><br/><sub><b>atian25</b></sub>](https://github.com/atian25)<br/>|[<img src="https://avatars.githubusercontent.com/u/5381764?v=4" width="100px;"/><br/><sub><b>paambaati</b></sub>](https://github.com/paambaati)<br/>|[<img src="https://avatars.githubusercontent.com/u/1433247?v=4" width="100px;"/><br/><sub><b>denghongcai</b></sub>](https://github.com/denghongcai)<br/>|[<img src="https://avatars.githubusercontent.com/u/2842176?v=4" width="100px;"/><br/><sub><b>XadillaX</b></sub>](https://github.com/XadillaX)<br/>|[<img src="https://avatars.githubusercontent.com/u/1147375?v=4" width="100px;"/><br/><sub><b>alsotang</b></sub>](https://github.com/alsotang)<br/>|
|[<img src="https://avatars.githubusercontent.com/u/546535?v=4" width="100px;"/><br/><sub><b>leoner</b></sub>](https://github.com/leoner)<br/>|[<img src="https://avatars.githubusercontent.com/u/19908330?v=4" width="100px;"/><br/><sub><b>hyj1991</b></sub>](https://github.com/hyj1991)<br/>|[<img src="https://avatars.githubusercontent.com/u/1747852?v=4" width="100px;"/><br/><sub><b>isayme</b></sub>](https://github.com/isayme)<br/>|[<img src="https://avatars.githubusercontent.com/u/6897780?v=4" width="100px;"/><br/><sub><b>killagu</b></sub>](https://github.com/killagu)<br/>|[<img src="https://avatars.githubusercontent.com/u/252317?v=4" width="100px;"/><br/><sub><b>cyjake</b></sub>](https://github.com/cyjake)<br/>|[<img src="https://avatars.githubusercontent.com/u/5856440?v=4" width="100px;"/><br/><sub><b>whxaxes</b></sub>](https://github.com/whxaxes)<br/>|
|[<img src="https://avatars.githubusercontent.com/u/309219?v=4" width="100px;"/><br/><sub><b>chadxz</b></sub>](https://github.com/chadxz)<br/>|[<img src="https://avatars.githubusercontent.com/u/5139554?v=4" width="100px;"/><br/><sub><b>danielwpz</b></sub>](https://github.com/danielwpz)<br/>|[<img src="https://avatars.githubusercontent.com/u/5127897?v=4" width="100px;"/><br/><sub><b>danielsss</b></sub>](https://github.com/danielsss)<br/>|[<img src="https://avatars.githubusercontent.com/u/3367820?v=4" width="100px;"/><br/><sub><b>Jeff-Tian</b></sub>](https://github.com/Jeff-Tian)<br/>|[<img src="https://avatars.githubusercontent.com/u/32407?v=4" width="100px;"/><br/><sub><b>jedahan</b></sub>](https://github.com/jedahan)<br/>|[<img src="https://avatars.githubusercontent.com/u/17075261?v=4" width="100px;"/><br/><sub><b>nick-ng</b></sub>](https://github.com/nick-ng)<br/>|
|[<img src="https://avatars.githubusercontent.com/u/1706595?v=4" width="100px;"/><br/><sub><b>rishavsharan</b></sub>](https://github.com/rishavsharan)<br/>|[<img src="https://avatars.githubusercontent.com/u/1886161?v=4" width="100px;"/><br/><sub><b>willizm</b></sub>](https://github.com/willizm)<br/>|[<img src="https://avatars.githubusercontent.com/u/7227589?v=4" width="100px;"/><br/><sub><b>davidkhala</b></sub>](https://github.com/davidkhala)<br/>|[<img src="https://avatars.githubusercontent.com/u/535479?v=4" width="100px;"/><br/><sub><b>aleafs</b></sub>](https://github.com/aleafs)<br/>|[<img src="https://avatars.githubusercontent.com/u/3689968?v=4" width="100px;"/><br/><sub><b>Amunu</b></sub>](https://github.com/Amunu)<br/>|[<img src="https://avatars.githubusercontent.com/in/9426?v=4" width="100px;"/><br/><sub><b>azure-pipelines[bot]</b></sub>](https://github.com/apps/azure-pipelines)<br/>|
|[<img src="https://avatars.githubusercontent.com/u/1281323?v=4" width="100px;"/><br/><sub><b>changzhiwin</b></sub>](https://github.com/changzhiwin)<br/>|[<img src="https://avatars.githubusercontent.com/u/929503?v=4" width="100px;"/><br/><sub><b>yuzhigang33</b></sub>](https://github.com/yuzhigang33)<br/>|[<img src="https://avatars.githubusercontent.com/u/981128?v=4" width="100px;"/><br/><sub><b>fishbar</b></sub>](https://github.com/fishbar)<br/>|[<img src="https://avatars.githubusercontent.com/u/1207064?v=4" width="100px;"/><br/><sub><b>gxcsoccer</b></sub>](https://github.com/gxcsoccer)<br/>|[<img src="https://avatars.githubusercontent.com/u/17476119?v=4" width="100px;"/><br/><sub><b>mars-coder</b></sub>](https://github.com/mars-coder)<br/>|[<img src="https://avatars.githubusercontent.com/u/929179?v=4" width="100px;"/><br/><sub><b>rockdai</b></sub>](https://github.com/rockdai)<br/>|
[<img src="https://avatars.githubusercontent.com/u/2196373?v=4" width="100px;"/><br/><sub><b>dickeylth</b></sub>](https://github.com/dickeylth)<br/>|[<img src="https://avatars.githubusercontent.com/u/13050025?v=4" width="100px;"/><br/><sub><b>aladdin-add</b></sub>](https://github.com/aladdin-add)<br/>

This project follows the git-contributor [spec](https://github.com/xudafeng/git-contributor), auto updated at `Tue Jul 05 2022 16:17:31 GMT+0800`.

<!-- GITCONTRIBUTOR_END -->

## License

[MIT](LICENSE)
