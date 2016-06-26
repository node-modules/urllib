'use strict';

var urllib = require('../');

urllib.request('http://cnodejs.org/', { wd: 'nodejs' }, function (err, data, res) {
  console.log(res.statusCode);
  console.log(res.headers);
  console.log(data.toString());
});
