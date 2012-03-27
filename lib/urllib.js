/**
 * Module dependencies.
 */

var http = require('http');
var urlutil = require('url');
var qs = require('querystring');

var USER_AGENT = exports.USER_AGENT = 'node-urllib/1.0';
var TIME_OUT = exports.TIME_OUT = 60000; // 60 seconds

// change Agent.maxSockets to 1000
exports.agent = new http.Agent();
exports.agent.maxSockets = 1000;

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
 *   - {Number} timeout: request timeout(in milliseconds), default is `exports.TIMEOUT`
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
    agent: exports.agent,
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
  var req = request_method(options, function(res) {
    var chunks = [], size = 0;
    res.on('data', function(chunk) {
      size += chunk.length;
      chunks.push(chunk);
    });
    res.on('end', function() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
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
  var timeout = args.timeout;
  timer = setTimeout(function() {
    timer = null;
    req.__isTimeout = true;
    req.abort();
  }, timeout);
  // req.setTimeout(timeout, function() {
  //   req.__isTimeout = true;
  //   req.abort();
  // });
  req.on('error', function(err) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (req.__isTimeout) {
      err.name = 'RequestTimeoutError';
      err.message = err.message + ', request timeout for ' + timeout + 'ms.';
    } else {
      err.name = 'RequestError';
    }
    callback.call(context, err);
  });
  req.end(body);
};

/**
 * guest data charset from req.headers and html content-type meta tag
 * headers:
 *  'content-type': 'text/html;charset=gbk'
 * meta tag:
 *  {meta http-equiv="Content-Type" content="text/html; charset=xxxx"/}
 * 
 * @param {Object} res
 * @param {Buffer} data
 * @return {String} charset (lower case, eg: utf-8, gbk, gb2312, ...)
 *  If can\'t guest, return null
 * @api public
 */
exports.getCharset = function getCharset(req, data) {
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
