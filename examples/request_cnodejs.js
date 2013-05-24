/*!
 * urllib - example
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var urllib = require('../');
var url = 'http://tieba.baidu.com/f?kw=%E5%8D%8E%E5%8D%97%E7%90%86%E5%B7%A5%E5%A4%A7%E5%AD%A6'
var args = {
	decode: 'gbk'
}
urllib.request(url, args, function (err, data, res) {
  console.log(res.statusCode);
  console.log(res.headers);
  console.log(data);
});