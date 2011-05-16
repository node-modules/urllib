/**
 * Module dependencies.
 */

var http = require('http')
  , urllib = require('url')
  , qs = require('querystring')
  , Iconv  = require('./iconv').Iconv;

/**
 * guest data charset from req.headers and html content-type meta tag
 * headers:
 * 	'content-type': 'text/html;charset=gbk'
 * meta tag:
 * 	{meta http-equiv="Content-Type" content="text/html; charset=xxxx"/}
 * 
 * @param {Object} res
 * @param {Buffer} data
 * @return {String} charset (lower case, eg: utf-8, gbk, gb2312, ...)
 * 	If can\'t guest, return null
 * @api public
 */
function get_charset(req, data) {
	var CHARTSET_RE = /charset=([\w\-]+)/ig;
	var charset = null;
	var content_type = req.headers['content-type'];
	if(!content_type) {
		// test before 1024 bytes
		var end = data.length;
		if(end > 512) {
			end = 512;
		}
		content_type = data.slice(0, end).toString();
	}
	var matchs = CHARTSET_RE.exec(content_type);
	if(matchs) {
		charset = matchs[1].toLowerCase();
	} else if(req.headers['content-type']) {
		content_type = data.slice(0, end).toString();
		matchs = CHARTSET_RE.exec(content_type);
		if(matchs) {
			charset = matchs[1].toLowerCase();
		}
	}
	return charset;
};

function get_request_options(url, data, options) {
	options = options || {};
	options.method = (options.method || 'get').toLowerCase();
	var handle_redirect = options.handle_redirect;
	var handle_data = options.handle_data;
	if(handle_redirect === undefined) {
		handle_redirect = true;
	}
	if(handle_data === undefined) {
		handle_data = true;
	}
	var urlinfo = urllib.parse(url);
	var op = {
		host: urlinfo.hostname,
		port: urlinfo.port || 80,
		path: urlinfo.pathname + (urlinfo.search || ''),
		method: options.method
	};
	var body = null;
	if(data) {
		body = qs.encode(data);
		if(op.method == 'get') {
			if(op.path.indexOf('?') < 0) {
				op.path += '?';
			} else {
				op.path += '&';
			}
			op.path += body;
			body = null;
		}
	}
	return {
		body: body, 
		options: op, 
		protocol: urlinfo.protocol || 'http:', 
		handle_redirect: handle_redirect,
		handle_data: handle_data
	};
};

/**
 * urlopen like python urllib.urlopen
 * 
 * @param {String} url
 * @param {Object} data
 * @param {Object} options
 *  - method: get or post, default is get
 *  - agent:
 *  - referfer:
 * @param {Function} callback
 * @api public
 */
function urlopen(url, data, options, callback) {
	if(typeof(data) === 'function') {
		callback = data;
		data = null;
		options = null;
	} else if(typeof(options) === 'function') {
		callback = options;
		options = null;
	}
	options = options || {};
	var params = get_request_options(url, data, options);
//	console.log(params);
	var req =  http.request(params.options, function(res) {
//		console.log("Got response: " + res.statusCode, params.handle_redirect);
//		console.log('headers:', res.headers);
		if((res.statusCode == 301 || res.statusCode == 302) && params.handle_redirect) {
//			console.log(res.statusCode, 'redirect', res.headers.location);
			if(params.options.method == 'post') {
				// redirect only support get
				options.method = 'get';
			}
			return urlopen(res.headers.location, null, options, callback);
		}
		res.realurl = url;
		// handle data or by your self
		if(params.handle_data) {
			var buffers = [], size = 0;
			res.on('data', function(buffer) {
				buffers.push(buffer);
				size += buffer.length;
			});
			res.on('end', function() {
				var buffer = new Buffer(size), pos = 0;
				for(var i = 0, len = buffers.length; i < len; i++) {
					buffers[i].copy(buffer, pos);
					pos += buffers[i].length;
				}
				// 'content-type': 'text/html;charset=gbk',
				var charset = get_charset({headers:{}}, buffer);
				// console.log('guess charset:', charset);
				if(charset && charset != 'utf-8' && charset != 'utf8') {
					var charset_iconv = new Iconv(charset, 'utf8');
					buffer = charset_iconv.convert(buffer);
				}
				callback(null, buffer, res);
			});
		} else {
			callback(null, null, res);
		}
	});
	req.on('error', function(e) {
		console.log("Got error: " + e.message);
		//callback(e);
	});
	if(params.body) {
		req.write(params.body);
	}
	req.end();
};

/**
 * util function for url post
 * 
 * usage:
 * 
 * 	urlpost('http://www.google.com/', {q: 'cnodejs'}, function(err, data, res) {
 *  	console.log(res.statusCode);
 *  	console.log(res.headers);
 *  	console.log(data.toString());
 *  });
 * 
 * @api public
 */
function urlpost(url, data, options, callback) {
	if(typeof(data) === 'function') {
		callback = data;
		data = null;
		options = {};
	} else if(typeof(options) === 'function') {
		callback = options;
		options = {};
	}
	options.method = 'post';
	urlopen(url, data, options, callback);
};

/**
 * util function for url get
 * 
 * usage:
 * 
 *  urlget('http://www.baidu.com/', {wd: 'cnodejs'}, function(err, data, res) {
 *  	console.log(res.statusCode);
 *  	console.log(res.headers);
 *  	console.log(data.toString());
 *  });
 *  
 * @api public
 */
function urlget(url, data, options, callback) {
	if(typeof(data) === 'function') {
		callback = data;
		data = null;
		options = {};
	} else if(typeof(options) === 'function') {
		callback = options;
		options = {};
	}
	options.method = 'get';
	urlopen(url, data, options, callback);
};

// TODO: batch urlopen

// exports for require
exports.urlpost = urlpost;
exports.urlget = urlget;
exports.get_charset = get_charset;
exports.get_request_options = get_request_options;