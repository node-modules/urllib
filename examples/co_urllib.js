'use strict';

var co = require('co');
var urllib = require('../');

co(function* () {
  var result = yield urllib.requestThunk('http://nodejs.org', {
    gzip: true
  });
  console.log('status: %s, body size: %d, headers: %j',
    result.res.statusCode, result.data.length, result.res.headers);

  try {
    yield urllib.requestThunk('http://noexists.domain-no-exists.com');
  } catch (err) {
    console.log(err);
  }
})();
