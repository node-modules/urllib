/**
 * Module dependencies.
 */

var urllib = require('../');
var should = require('should');
var http = require('http');

http.createServer(function(req, res) {
	req.on('end', function() {
		if (req.url === '/timeout') {
			setTimeout(function() {
				res.writeHeader(200);
				res.end('timeout 500ms');
			}, 500);
		} else if (req.url === '/error') {
			res.destroy();
		}
	});
}).listen(43624);

describe('urllib', function() {

	describe('#get_charset()', function() {
		it('should return the correct charset', function(done) {
			var cases = [
		    ['http://baidu.com', null, 200], // <meta http-equiv="refresh" content="0;url=http://www.baidu.com/">
		    ['http://www.baidu.com', 'gb2312', 200],
		    ['http://www.baidu.com/s?kw=cnodejs', 'gbk', 200],
		    ['http://club.cnodejs.org/', 'utf-8', 200],
		    ['http://cnodejs.org/log', null, 404],
		    ['http://www.taobao.com', 'gb2312', 200],
		    ['http://weibo.com', 'utf-8', 200]
			];
			var count = 0;
			cases.forEach(function(c) {
				urllib.request(c[0], function(err, data, res) {
					should.ok(!err);
					data.should.be.an.instanceof(Buffer);
					res.should.status(c[2]);
					count++;
					var end = data.length;
					if (end > 512) {
						end = 512;
					}
					var log = '\nurl: ' + c[0];
					log += '\nerror: ' + err;
					log += '\nstatus: ' + res.statusCode;
					log += '\nheaders: ' + JSON.stringify(res.headers);
					log += '\nhtml head: ' + data.slice(0, end).toString();
					var charset = urllib.get_charset(res, data);
					// console.log(charset, c[1], c)
					should.ok(c[1] === charset);
					//console.log(res.realurl);
					if (count === cases.length) {
						done();
					}
				});
			});
		});
	});

	describe('#request()', function() {
		it('should 301', function(done) {
			urllib.request('http://google.com', function(err, data, res) {
				res.should.status(301);
				done();
			});
		});
		it('should 302', function(done) {
			urllib.request('http://t.cn/zOJdq1R', function(err, data, res) {
				res.should.status(302);
				done();
			});
		});
		it('should 500ms timeout', function(done) {
			urllib.request('http://127.0.0.1:43624/timeout', { timeout: 450 }, function(err, data, res) {
				should.exist(err);
				err.name.should.equal('RequestTimeoutError');
				err.stack.should.match(/^RequestTimeoutError: socket hang up, request timeout for 450ms\./);
				should.not.exist(data);
				should.not.exist(res);
				done();
			});
		});
		it('should error', function(done) {
			urllib.request('http://127.0.0.1:43624/error', function(err, data, res) {
				console.log(err)
				res.should.status(302);
				done();
			});
		});
	});

});