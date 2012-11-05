# urllib [![Build Status](https://secure.travis-ci.org/TBEDP/urllib.png?branch=master)](http://travis-ci.org/TBEDP/urllib)

![logo](https://raw.github.com/TBEDP/urllib/master/logo.png)

Help in opening URLs (mostly HTTP) in a complex world — basic and digest authentication, redirections, cookies and more.

* jscoverage: [98%](http://fengmk2.github.com/coverage/urllib.html)

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

### Upload file with [`formstream`](https://github.com/fengmk2/formstream)

```js
var urllib = require('urllib');
var formstream = require('formstream');
var should = require('should');

var form = formstream();
form.file('file', __filename);
form.field('hello', '你好urllib');
var args = {
  type: 'POST',
  headers: form.headers(),
  stream: form
};
var req = urllib.request(host + '/stream', args, function (err, data, res) {
  should.not.exist(err);
  data = data.toString();
  data.should.include('你好urllib\r\n----------------------------');
  data.should.include('Content-Disposition: form-data; name="file"; filename="urllib.test.js"');
});

// you can abort the request after 5 seconds
setTimout(function () {
  req.abort();
}, 5000);
```

## TODO

* Upload file like form upload.
* Auto redirect handle.

## Authors

Below is the output from `git-summary`.

```bash
$ git summary 

 project  : urllib
 repo age : 1 year, 6 months
 active   : 18 days
 commits  : 38
 files    : 16
 authors  : 
    33  fengmk2                 86.8%
     4  Jackson Tian            10.5%
     1  aleafs                  2.6%
```

## Contributors
Ordered by date of first contribution.
[Auto-generated](http://github.com/dtrejo/node-authors) on Tue Aug 14 2012 03:17:14 GMT+0800 (CST).

- [fengmk2](http://fengmk2.github.com)
- [aleafs](https://github.com/aleafs)
- [Jackson Tian aka `JacksonTian`](https://github.com/JacksonTian)

## License 

(The MIT License)

Copyright (c) 2011-2012 fengmk2 &lt;fengmk2@gmail.com&gt;

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
