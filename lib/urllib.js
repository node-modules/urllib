/**
 * Module dependencies.
 */

var http = require('http');
var urlutil = require('url');
var qs = require('querystring');
var Iconv  = require('./iconv').Iconv;

var USER_AGENT = exports.USER_AGENT = 'node-urllib/1.0';
var TIME_OUT = exports.TIME_OUT = 60000; // 60 seconds

// change Agent.defaultMaxSockets to 1000
http.Agent.defaultMaxSockets = 1000;

/**
 * The default request timeout(in milliseconds).
 * @type {Number}
 * @const
 */
exports.TIMEOUT = 5000;


/**
 * Handle all http request, both http and https support well.
 *
 * @example
 * 
 * var urllib = require('urllib');
 * // GET http://httptest.cnodejs.net
 * urllib.request('http://httptest.cnodejs.net/test/get', function(err, data, res) {});
 * // POST http://httptest.cnodejs.net
 * var args = { type: 'post', data: { foo: 'bar' } };
 * urllib.request('http://httptest.cnodejs.net/test/post', args, function(err, data, res) {});
 * 
 * @param {String} url
 * @param {Object} args
 *   - {Object} data: request data
 *   - {String|Buffer} content: optional, if set content, `data` will ignore
 *   - {String} type: optional, could be GET | POST | DELETE | PUT, default is GET
 *   - {String} data_type: `text` or `json`, default is text
 *   - {Object} headers: 
 *   - {Number} timeout: request timeout(in milliseconds), default is urllib.TIMEOUT(60 seconds)
 * @param {Function} callback, callback(error, data, res)
 * @param {Object} optional context of callback, callback.call(context, error, data, res)
 * @api public
 */
exports.request = function(url, args, callback, context) {
  if (typeof args === 'function') {
    context = callback;
    callback = args;
    args = null;
  }
  args = args || {};
  args.timeout = args.timeout || exports.TIMEOUT;
  args.type = (args.type || 'GET').toUpperCase();
  var info = urlutil.parse(url);
  var method = args.type;
  var request_method = http.request;
  var port = info.port || 80;
  if (info.protocol == 'https:') {
    request_method = https.request;
    if (!info.port) {
      port = 443;
    }
  }
  var options = {
    host: info.hostname,
    path: info.path || '/',
    method: method,
    port: port,
    headers: args.headers || {}
  };
  var body = args.content || args.data;
  if (!args.content) {
    if(body && !(body instanceof String || body instanceof Buffer)) {
      body = qs.stringify(body);
    }
  }
  if (method === 'GET' && body) {
    options.path += (info.query ? '' : '?') + body;
    body = null;
  }
  if (body) {
    options.headers['Content-Length'] = body.length;
  }
  var timer = null;
  var timeoutError = null;
  var req = request_method(options, function(res) {
    if (timer) {
      clearTimeout(timer);
    }
    var chunks = [], size = 0;
    res.on('data', function(chunk) {
      size += chunk.length;
      chunks.push(chunk);
    });
    res.on('end', function() {
      var data = null;
      switch(chunks.length) {
        case 0: data = new Buffer(0); break;
        case 1: data = chunks[0]; break;
        default:
          data = new Buffer(size);
          for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {
            chunks[i].copy(data, pos);
            pos += chunks[i].length;
          }
          break;
      }
      callback.call(context, null, data, res);
    });
  });
  req.on('error', function(err) {
    if (timer) {
      clearTimeout(timer);
    }
    callback.call(context, timeoutError || err);   
  });
  if (body) {
    req.write(body);
  }
  req.end();

  timer = setTimeout(function() {
    timer = null;
    timeoutError = new Error('Request Timeout');
    timeoutError.statusCode = 0;    
    req.abort();
  }, args.timeout);
};

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
	options.headers = options.headers || {};
	if(!options.headers['user-agent']) {
		options.headers['user-agent'] = USER_AGENT;
	}
	var handle_redirect = options.handle_redirect;
	var handle_data = options.handle_data;
	if(handle_redirect === undefined) {
		handle_redirect = true;
	}
	if(handle_data === undefined) {
		handle_data = true;
	}
	var urlinfo = urlutil.parse(url);
	var op = {
		host: urlinfo.hostname,
		port: urlinfo.port || 80,
		path: urlinfo.pathname + (urlinfo.search || ''),
		method: options.method,
		headers: options.headers
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
	if (typeof(data) === 'function') {
		callback = data;
		data = null;
		options = null;
	} else if(typeof(options) === 'function') {
		callback = options;
		options = null;
	}
	options = options || {};
	var params = get_request_options(url, data, options);
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
				if(charset && charset !== 'utf-8' && charset !== 'utf8') {
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
		//console.log("Got error: " + e.message);
		callback(e);
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

function do_batchs(fn, url_tasks, callback) {
	var count = url_tasks.length
	  , results = {};
	url_tasks.forEach(function(url_task) {
		var args = url_task;
		if(typeof(args) === 'string') {
			args = [args];
		}
		var url = args[0];
		args.push(function(err, buffer, res) {
			results[url] = [err, buffer, res];
			if(--count == 0) {
				// all task have done
				callback(results);
			}
		});
		fn.apply(null, args);
	});
};

/**
 * batch urls get
 * 
 * @params {Array} url_tasks
 * 	[url1, url2, url3, ...]
 *  or
 *  [[url, data, options], [url2, data2, options2], ...] just like call urlget method
 * @params {Function} callback
 * 	callback({url1: [err, buffer, res], url2: [err, buffer, res], ...});
 * @api public
 */
function urlgets(url_tasks, callback) {
	do_batchs(urlget, url_tasks, callback);
};

function urlposts(url_tasks, callback) {
	do_batchs(urlpost, url_tasks, callback);
};

// exports for require
exports.urlopen = urlopen;
exports.urlpost = urlpost;
exports.urlget = urlget;
exports.get_charset = get_charset;
exports.get_request_options = get_request_options;
