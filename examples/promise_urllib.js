'use strict';

var urllib = require('../');

urllib.request('http://nodejs.org').then(function (result) {
  console.log('status: %s, body size: %d, headers: %j', result.res.statusCode, result.data.length, result.res.headers);
}).error(function (err) {
  console.error(err);
});
