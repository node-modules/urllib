# urllib [![Build Status](https://secure.travis-ci.org/TBEDP/urllib.png?branch=master)](http://travis-ci.org/TBEDP/urllib) [![Coverage Status](https://coveralls.io/repos/TBEDP/urllib/badge.png)](https://coveralls.io/r/TBEDP/urllib)

![logo](https://raw.github.com/TBEDP/urllib/master/logo.png)

Help in opening URLs (mostly HTTP) in a complex world — basic and digest authentication, redirections, cookies and more.

* jscoverage: [99%](http://fengmk2.github.com/coverage/urllib.html)

## Install

```bash
$ npm install urllib
```

## Usage

```js
var urllib = require('urllib');

urllib.request('http://cnodejs.org/', { wd: 'nodejs' }, function (err, data, res) {
  console.log(res.statusCode);
  console.log(res.headers);
  console.log(data.toString());
});
```

## API Doc

### .request(url[, options][, callback][, content])

#### Arguments

- **url** String | Object - The URL to request, either a String or a Object that return by [url.parse](http://nodejs.org/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost).
- ***options*** Object - Optional
  - ***method*** String - Request method, defaults to `GET`. Could be `GET`, `POST`, `DELETE` or `PUT`. Alias 'type'.
  - ***data*** Object - Data to be sent. Will be stringify automatically.
  - ***content*** String | [Buffer](http://nodejs.org/api/buffer.html) - Manually set the content of payload. If set, `data` will be ignored.
  - ***stream*** [stream.Readable](http://nodejs.org/api/stream.html#stream_class_stream_readable) - Stream to be pipe to the remote. If set, `data` and `content` will be ignored.
  - ***writeStream*** [stream.Writable](http://nodejs.org/api/stream.html#stream_class_stream_writable) - A writable stream to be piped by the response stream. Responding data will be write to this stream and `callback` will be called with `data` set `null` after finished writing
  - ***dataType*** String - Type of response data. Could be `text` or `json`. If it's `text`, the `callback`ed `data` would be a Buffer. If it's `json`, the `data` of callback would be a parsed JSON Object. Defaults to `text`.
  - ***headers*** Object - Request headers
  - ***timeout*** Number - Request timeout in milliseconds. Defaults to `exports.TIMEOUT`.
  - ***auth*** String - `username:password` used in HTTP Basic Authorization
  - ***agent*** [http.Agent](http://nodejs.org/api/http.html#http_class_http_agent) - HTTP Agent object
  - ***httpsAgent*** [https.Agent](http://nodejs.org/api/https.html#https_class_https_agent) - HTTPS Agent object
- ***callback(err, data, res)*** Function - Optional
  - **err** Error - Would be `null` if no error accured.
  - **data** Buffer | Object - The data responsed. Would be a Buffer if `dataType` is set to `text` or an JSON parsed into Object if it's set to `json`
  - **res** [stream.Readable](http://nodejs.org/api/stream.html#stream_class_stream_readable) - The response stream.

#### Returns

[stream.Writable](http://nodejs.org/api/stream.html#stream_class_stream_writable) - The request stream.

Calling `.abort()` method of the request stream can cancel the request.

#### `options.data`

When making a request:

```js
urllib.request('http://example.com', {
  type: 'GET',
  data: {
    'a': 'hello',
    'b': 'world'
  }
});
```

For `GET` request, `data` will be stringify to query string, e.g. `http://example.com/?a=hello&world`.

For `POST` or `PUT` request, in defaults, the `data` will be stringify into `application/x-www-form-urlencoded`.

#### `options.content`

`options.content` is useful when you wish to construct the request body by yourself, for example making a `Content-Type: application/json` request.

Notes that if you want to send a JSON body, you should stringify it yourself:

```js
urllib.request('http://example.com', {
  type: 'POST',
  headers: {
    'content-type': 'application/json'
  },
  content: JSON.stringify({
    'a': 'hello',
    'b': 'world'
  })
});
```

It would make a HTTP request like:

```http
POST / HTTP/1.1
Host: example.com
Content-Type: application/json

{
  "a": "hello",
  "b": "world"
}
```

#### `options.stream`

Uploads a file with [formstream](https://github.com/fengmk2/formstream):

```js
var urllib = require('urllib');
var formstream = require('formstream');

var form = formstream();
form.file('file', __filename);
form.field('hello', '你好urllib');

var req = urllib.request('http://my.server.com/upload', {
  type: 'POST',
  headers: form.headers(),
  stream: form
}, function (err, data) {
  // upload finished
});
```

## TODO

* [ ] Support component
* [√] Upload file like form upload
* [ ] Auto redirect handle

## Authors

Below is the output from `git-summary`.

```bash
$ git summary

 project  : urllib
 repo age : 2 years, 2 months
 active   : 26 days
 commits  : 60
 files    : 16
 authors  :
    54  fengmk2                 90.0%
     4  Jackson Tian            6.7%
     1  XiNGRZ                  1.7%
     1  aleafs                  1.7%
```

## License

(The MIT License)

Copyright (c) 2011-2013 fengmk2 &lt;fengmk2@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
