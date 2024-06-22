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
and digest authentication, redirections, timeout and more.

## Install

```bash
npm install urllib
```

## Usage

### TypeScript and ESM

```ts
import { request } from 'urllib';

const { data, res } = await request('http://cnodejs.org/');
// result: { data: Buffer, res: Response }
console.log('status: %s, body size: %d, headers: %j', res.status, data.length, res.headers);
```

### CommonJS

```js
const { request } = require('urllib');

const { data, res } = await request('http://cnodejs.org/');
// result: { data: Buffer, res: Response }
console.log('status: %s, body size: %d, headers: %j', res.status, data.length, res.headers);
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
  - ***timeout*** Number | Array - Request timeout in milliseconds for connecting phase and response receiving phase. Default is `5000`. You can use `timeout: 5000` to tell urllib use same timeout on two phase or set them seperately such as `timeout: [3000, 5000]`, which will set connecting timeout to 3s and response 5s.
  - **keepAliveTimeout** `number | null` - Default is `4000`, 4 seconds - The timeout after which a socket without active requests will time out. Monitors time between activity on a connected socket. This value may be overridden by *keep-alive* hints from the server. See [MDN: HTTP - Headers - Keep-Alive directives](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive#directives) for more details.
  - ***auth*** String - `username:password` used in HTTP Basic Authorization.
  - ***digestAuth*** String - `username:password` used in HTTP [Digest Authorization](https://en.wikipedia.org/wiki/Digest_access_authentication).
  - ***followRedirect*** Boolean - follow HTTP 3xx responses as redirects. defaults to true.
  - ***maxRedirects*** Number - The maximum number of redirects to follow, defaults to 10.
  - ***formatRedirectUrl*** Function - Format the redirect url by your self. Default is `url.resolve(from, to)`.
  - ***beforeRequest*** Function - Before request hook, you can change every thing here.
  - ***streaming*** Boolean - let you get the `res` object when request  connected, default `false`. alias `customResponse`
  - ***compressed*** Boolean - Accept `gzip, br` response content and auto decode it, default is `true`.
  - ***timing*** Boolean - Enable timing or not, default is `true`.
  - ***socketPath*** String | null - request a unix socket service, default is `null`.
  - ***highWaterMark*** Number - default is `67108864`, 64 KiB.

#### Options: `options.data`

When making a request:

```js
await request('https://example.com', {
  method: 'GET',
  data: {
    'a': 'hello',
    'b': 'world',
  },
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
    'Content-Type': 'application/json',
  },
  content: JSON.stringify({
    a: 'hello',
    b: 'world',
  }),
});
```

It would make a HTTP request like:

```bash
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
- `socket`: socket info

## Run test with debug log

```bash
NODE_DEBUG=urllib:* npm test
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

## Request through a http proxy

export from [undici](https://undici.nodejs.org/#/docs/best-practices/proxy)

```ts
import { ProxyAgent, request } from 'urllib';

const proxyAgent = new ProxyAgent('http://my.proxy.com:8080');
const response = await request('https://www.npmjs.com/package/urllib', {
  dispatcher: proxyAgent,
});
console.log(response.status, response.headers);
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

## License

[MIT](LICENSE)

<!-- GITCONTRIBUTOR_START -->

## Contributors

[![Contributors](https://contrib.rocks/image?repo=node-modules/urllib)](https://github.com/node-modules/urllib/graphs/contributors)

Made with [contributors-img](https://contrib.rocks).
