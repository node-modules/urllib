
module.exports = {
	
	'get_charset': function() {
		var cases = [
		    ['baidu.com', 'gb2312'],
		    ['http://www.baidu.com/s?kw=cnodejs', 'gbk'],
		    ['http://cnodejs.org/', 'utf-8'],
		    ['http://cnodejs.org/', 'utf-8'],
		    ['http://weibo.com', 'utf-8']
		];
	},
	
	'get_request_options': function() {
		
	},
	
	'urlget': function() {
		
	}
};