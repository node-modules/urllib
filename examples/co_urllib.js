var co = require('co');
var urllib = require('../');

co(function* () {
  var result = yield urllib.request('http://nodejs.org');
  console.log('status: %s, body size: %d, headers: %j',
    result.res.statusCode, result.data.length, result.res.headers);

  try {
    yield urllib.request('http://noexists.nsdfsfdsdf.com');
  } catch (err) {
    console.log(err);
  }
})();
