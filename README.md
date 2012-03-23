# urllib

[![Build Status](https://secure.travis-ci.org/TBEDP/urllib.png)](http://travis-ci.org/TBEDP/urllib)

Help in opening URLs (mostly HTTP) in a complex world — basic and digest authentication, redirections, cookies and more. Like python  _urllib_ module.

## Install

```bash
$ npm install urllib
```

## Usage

### urllib.request()

```
var urllib = require('urllib');

urllib.request('http://cnodejs.org/', { wd: 'nodejs' }, function(err, data, res) {
  console.log(res.statusCode);
  console.log(res.headers);
  console.log(data.toString());
});
```

## TODO

* Auto redirect handle.
* Bash auth support.
