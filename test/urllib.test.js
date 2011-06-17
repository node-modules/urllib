/**
 * Module dependencies.
 */

var urllib = require('../')
  , assert = require('assert');

module.exports = {
	
	'get_charset': function() {
		var cases = [
		    ['http://baidu.com', null], // <meta http-equiv="refresh" content="0;url=http://www.baidu.com/">
		    ['http://www.baidu.com', 'gb2312'],
		    ['http://www.baidu.com/s?kw=cnodejs', 'gbk'],
		    ['http://cnodejs.org/', 'utf-8'],
		    ['http://cnodejs.org/log', null],
		    ['http://taobao.com', 'gb2312'],
		    ['http://weibo.com', 'utf-8']
		];
		cases.forEach(function(c){
			urllib.urlget(c[0], function(err, data, res) {
				var end = data.length;
				if(end > 512) {
					end = 512;
				}
				var log = '\nurl: ' + c[0];
				log += '\nerror: ' + err;
				log += '\nstatus: ' + res.statusCode;
				log += '\nheaders: ' + JSON.stringify(res.headers);
				log += '\nhtml head: ' + data.slice(0, end).toString();
				var charset = urllib.get_charset(res, data);
				assert.equal(charset, c[1], log);
				//console.log(res.realurl);
			});
		});
	},
	
	'redirect': function(){
		var cases = [
 		    // ['http://baidu.com', 'http://www.baidu.com/'], // <meta http-equiv="refresh" content="0;url=http://www.baidu.com/">
 		    ['http://www.baidu.com/s?kw=cnodejs', 'http://www.baidu.com/s?kw=cnodejs'],
 		    ['http://cnodejs.org/', 'http://cnodejs.org/blog/'],
 		    ['http://taobao.com', 'http://www.taobao.com/'],
 		    ['http://t.cn/heVleY', 'http://user.qzone.qq.com/309389312/blog/1305512153']
 		];
		cases.forEach(function(c){
			urllib.urlget(c[0], null, {handle_data: false}, function(err, data, res) {
				var log = '\nurl: ' + c[0];
				log += '\nrealurl: ' + res.realurl;
				log += '\nerror: ' + err;
				log += '\nstatus: ' + res.statusCode;
				log += '\nheaders: ' + JSON.stringify(res.headers);
				assert.equal(res.realurl, c[1], log);
			});
		});
	},
	
	'get_request_options': function() {
		
	},
	
	'urlgets': function() {
		var cases = [
  		    //['http://baidu.com', 'http://www.baidu.com/'], // <meta http-equiv="refresh" content="0;url=http://www.baidu.com/">
  		    ['http://www.baidu.com/s?kw=cnodejs', 'http://www.baidu.com/s?kw=cnodejs'],
  		    ['http://cnodejs.org/', 'http://cnodejs.org/blog/'],
  		    ['http://taobao.com', 'http://www.taobao.com/'],
  		    ['http://t.cn/heVleY', 'http://user.qzone.qq.com/309389312/blog/1305512153']
  		];
		var urls = [];
		for(var i = 0; i < cases.length; i++) {
			urls.push(cases[i][0]);
		}
		urllib.urlgets(urls, function(results) {
			for(var i = 0; i < cases.length; i++) {
				var c = cases[i];
				var result = results[c[0]];
				var res = result[2];
				assert.equal(result[0], null);
				assert.ok(result[1].length > 0);
				assert.equal(c[1], res.realurl);
			}
		});
	}
	
//	'urlpost': function() {
//		urllib.urlpost('http://www.postyourtest.com/tests', {kw: 'cnodejs'}, function(err, data, res) {
//			console.log(res.headers);
//			console.log(data.slice(0, 512).toString())
//		});
//	}
};