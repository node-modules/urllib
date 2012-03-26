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

# Authors

Below is the output from `git-summary`.

```
 project: urllib
 commits: 17
 files  : 9
 authors: 
    13	fengmk2                 76.5%
     3	Jackson Tian            17.6%
     1	aleafs                  5.9%
```
