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
var debug = require('debug')('urllib');
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

var REQUEST_ID = 0;

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
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
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

  var reqId = ++REQUEST_ID;
  // make request
  var req = httplib.request(options, function (res) {
    if (writeStream) {
      // If there's a writable stream to recieve the response data, just pipe the
      // response stream to that writable stream and call the callback when it has
      // finished writing.
      //
      // NOTE that when the response stream `res` emits an 'end' event it just
      // means that it has finished piping data to another stream. In the
      // meanwhile that writable stream may still writing data to the disk until
      // it emits a 'close' event.
      //
      // That means that we should not apply callback until the 'close' of the
      // writable stream is emited.
      //
      // See also:
      // - https://github.com/TBEDP/urllib/commit/959ac3365821e0e028c231a5e8efca6af410eabb
      // - http://nodejs.org/api/stream.html#stream_event_end
      // - http://nodejs.org/api/stream.html#stream_event_close_1

      writeStream.on('close', done.bind(null, null, null, res));
      return res.pipe(writeStream);
    }

    // Otherwise, just concat those buffers.
    //
    // NOTE that the `chunk` is not a String but a Buffer. It means that if
    // you simply concat two chunk with `+` you're actually converting both
    // Buffers into Strings before concating them. It'll cause problems when
    // dealing with multi-byte characters.
    //
    // The solution is to store each chunk in an array and concat them with
    // 'buffer-concat' when all chunks is recieved.
    //
    // See also:
    // http://cnodejs.org/topic/4faf65852e8fb5bc65113403

    var chunks = [];
    var size = 0;

    res.on('data', function (chunk) {
      debug('Request#%d %s: `res data` event emit, size %d', reqId, options.path, chunk.length);
      size += chunk.length;
      chunks.push(chunk);
    });

    res.on('close', function () {
      debug('Request#%d %s: `res close` event emit, total size %d', reqId, options.path, size);
    });

    res.on('aborted', function () {
      res.aborted = true;
      debug('Request#%d %s: `res aborted` event emit, total size %d', reqId, options.path, size);
    });

    res.on('end', function () {
      debug('Request#%d %s: `res end` event emit, total size %d', reqId, options.path, size);
      var data = Buffer.concat(chunks, size);
      var err = null;
      if (args.dataType === 'json') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          err = e;
        }
      }

      if (res.aborted) {
        err = new Error('Remote socket was terminated before `response.end()` was called');
        err.name = 'RemoteSocketClosedError';
      }

      done(err, data, res);
    });
  });

  var timeout = args.timeout;
  var __err = null;

  timer = setTimeout(function () {
    timer = null;
    var msg = 'Request#' + reqId + ' timeout for ' + timeout + 'ms';
    __err = new Error(msg);
    __err.name = 'RequestTimeoutError';
    req.abort();
  }, timeout);

  req.on('close', function () {
    debug('Request#%d %s: `req close` event emit', reqId, options.path);
  });

  req.once('error', function (err) {
    if (!__err && err.name === 'Error') {
      err.name = 'RequestError';
    }
    err = __err || err;
    debug('Request#%d %s `error` event emit, %s: %s', reqId, options.path, err.name, err.message);
    done(err);
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

  req.requestId = reqId;
  return req;
};
