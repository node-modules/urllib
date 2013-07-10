/**
 * Module dependencies.
 */

require('buffer-concat');
var http = require('http');
var https = require('https');
var urlutil = require('url');
var qs = require('querystring');
var path = require('path');
var fs = require('fs');
var pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'package.json')));

var USER_AGENT = exports.USER_AGENT = 'node-urllib/' + pkg.version;
var TIME_OUT = exports.TIME_OUT = 60000; // 60 seconds

// change Agent.maxSockets to 1000
exports.agent = new http.Agent();
exports.agent.maxSockets = 1000;

exports.httpsAgent = new https.Agent();
exports.httpsAgent.maxSockets = 1000;

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
 * @param {String|Object} url
 * @param {Object} [args], optional
 *   - {Object} [data]: request data, will auto be query stringify.
 *   - {String|Buffer} [content]: optional, if set content, `data` will ignore.
 *   - {ReadStream} [stream]: read stream to sent.
 *   - {WriteStream} [writeStream]: writable stream to save response data.
 *       If you use this, callback's data should be null.
 *       We will just `pipe(ws, {end: true})`.
 *   - {String} [method]: optional, could be GET | POST | DELETE | PUT, default is GET
 *   - {String} [dataType]: optional, `text` or `json`, default is text
 *   - {Object} [headers]: optional, request headers
 *   - {Number} [timeout]: request timeout(in milliseconds), default is `exports.TIMEOUT`
 *   - {Agent} [agent]: optional, http agent
 *   - {Agent} [httpsAgent]: optional, https agent
 *   - {String} auth: Basic authentication i.e. 'user:password' to compute an Authorization header.
 * @param {Function} callback, callback(error, data, res)
 * @param {Object} optional context of callback, callback.call(context, error, data, res)
 * @return {HttpRequest} req object.
 * @api public
 */
exports.request = function (url, args, callback, context) {
  if (typeof args === 'function') {
    context = callback;
    callback = args;
    args = null;
  }

  args = args || {};

  args.timeout = args.timeout || exports.TIMEOUT;
  var parsedUrl = typeof url === 'string' ? urlutil.parse(url) : url;

  var method = (args.type || args.method || parsedUrl.method || 'GET').toUpperCase();
  var port = parsedUrl.port || 80;
  var httplib = http;
  var agent = args.agent || exports.agent;
  if (parsedUrl.protocol === 'https:') {
    httplib = https;
    agent = args.httpsAgent || exports.httpsAgent;
    if (!parsedUrl.port) {
      port = 443;
    }
  }

  var options = {
    host: parsedUrl.hostname || parsedUrl.host || 'localhost',
    path: parsedUrl.path || '/',
    method: method,
    port: port,
    agent: agent,
    headers: args.headers || {}
  };

  var auth = args.auth || parsedUrl.auth;
  if (auth) {
    options.auth = auth;
  }

  var body = args.content || args.data;
  if (!args.content) {
    if (body && !(typeof body === 'string' || Buffer.isBuffer(body))) {
      body = qs.stringify(body);
      if (method === 'POST' || method === 'PUT') {
        // auto add application/x-www-form-urlencoded when using urlencode form request
        if (!options.headers['Content-Type'] && !options.headers['content-type']) {
          options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      }
    }
  }

  // if it's a GET or HEAD request, data should be sent as query string
  if ((method === 'GET' || method === 'HEAD') && body) {
    options.path += (parsedUrl.query ? '&' : '?') + body;
    body = null;
  }

  if (body) {
    var length = body.length;
    if (!Buffer.isBuffer(body)) {
      length = Buffer.byteLength(body);
    }
    options.headers['Content-Length'] = length;
  }

  if (args.dataType === 'json') {
    options.headers.Accept = 'application/json';
  }

  var timer = null;
  var done = function (err, data, res) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (!callback) {
      return;
    }
    var cb = callback;
    callback = null;
    cb.call(context, err, data, res);
  };

  var writeStream = args.writeStream;

  var req = httplib.request(options, function (res) {
    if (writeStream) {
      writeStream.on('close', done.bind(null, null, null, res));
      return res.pipe(writeStream, {end: true});
    }
    var chunks = [];
    var size = 0;
    res.on('data', function (chunk) {
      size += chunk.length;
      chunks.push(chunk);
    });
    res.on('end', function () {
      var data = Buffer.concat(chunks, size);
      var err = null;
      if (args.dataType === 'json') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          err = e;
        }
      }
      done(err, data, res);
    });
  });

  var timeout = args.timeout;
  var __err = null;
  timer = setTimeout(function () {
    timer = null;
    __err = new Error('Request timeout for ' + timeout + 'ms.');
    __err.name = 'RequestTimeoutError';
    req.abort();
  }, timeout);
  req.once('error', function (err) {
    if (!__err && err.name === 'Error') {
      err.name = 'RequestError';
    }
    done(__err || err);
  });

  if (writeStream) {
    writeStream.once('error', function (err) {
      __err = err;
      req.abort();
    });
  }

  if (args.stream) {
    args.stream.pipe(req);
    args.stream.once('error', function (err) {
      __err = err;
      req.abort();
    });
  } else {
    req.end(body);
  }
  return req;
};
