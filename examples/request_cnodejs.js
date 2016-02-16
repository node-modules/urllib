/*
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

 "use strict";

/**
 * Module dependencies.
 */

var urllib = require('../');

urllib.request('http://cnodejs.org/', { wd: 'nodejs' }, function (err, data, res) {
  console.log(res.statusCode);
  console.log(res.headers);
  console.log(data.toString());
});
