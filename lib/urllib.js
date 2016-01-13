/**!
 * Copyright(c) node-modules and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var debug = require('debug')('urllib');
var http = require('http');
var https = require('https');
var urlutil = require('url');
var qs = require('querystring');
var zlib = require('zlib');
var ua = require('default-user-agent');
var digestAuthHeader = require('digest-header');
var typer = require('media-typer');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var ms = require('humanize-ms');
var statuses = require('statuses');

var _Promise;
var _iconv;

var pkg = require('../package.json');

var USER_AGENT = exports.USER_AGENT = ua('node-urllib', pkg.version);

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

exports.TIMEOUT = ms('5s');

var REQUEST_ID = 0;
var MAX_VALUE = Math.pow(2, 31) - 10;

/**
 * support data types
 * will auto decode response body
 * @type {Array}
 */
var TEXT_DATA_TYPES = [
  'json',
  'text'
];

/**
 * Handle all http request, both http and https support well.
 *
 * @example
 *
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
 *   - {String} [contentType]: optional, request data type, could be `json`, default is undefined
 *   - {String} [dataType]: optional, response data type, could be `text` or `json`, default is buffer
 *   - {Boolean} [fixJSONCtlChars]: optional, fix the control characters (U+0000 through U+001F)
 *       before JSON parse response. Default is `false`
 *   - {Object} [headers]: optional, request headers
 *   - {Number} [timeout]: request timeout(in milliseconds), default is `exports.TIMEOUT`
 *   - {Agent} [agent]: optional, http agent. Set `false` if you does not use agent.
 *   - {Agent} [httpsAgent]: optional, https agent. Set `false` if you does not use agent.
 *   - {String} [auth]: Basic authentication i.e. 'user:password' to compute an Authorization header.
 *   - {String} [digestAuth]: Digest authentication i.e. 'user:password' to compute an Authorization header.
 *   - {String|Buffer|Array} [ca]: An array of strings or Buffers of trusted certificates.
 *       If this is omitted several well known "root" CAs will be used, like VeriSign.
 *       These are used to authorize connections.
 *       Notes: This is necessary only if the server uses the self-signed certificate
 *   - {Boolean} [rejectUnauthorized]: If true, the server certificate is verified against the list of supplied CAs.
 *       An 'error' event is emitted if verification fails. Default: true.
 *   - {String|Buffer} [pfx]: A string or Buffer containing the private key,
 *       certificate and CA certs of the server in PFX or PKCS12 format.
 *   - {String|Buffer} [key]: A string or Buffer containing the private key of the client in PEM format.
 *       Notes: This is necessary only if using the client certificate authentication
 *   - {String|Buffer} [cert]: A string or Buffer containing the certificate key of the client in PEM format.
 *       Notes: This is necessary only if using the client certificate authentication
 *   - {String} [passphrase]: A string of passphrase for the private key or pfx.
 *   - {String} [ciphers]: A string describing the ciphers to use or exclude.
 *   - {String} [secureProtocol]: The SSL method to use, e.g. SSLv3_method to force SSL version 3.
 *       The possible values depend on your installation of OpenSSL and are defined in the constant SSL_METHODS.
 *   - {Boolean} [followRedirect]: Follow HTTP 3xx responses as redirects. defaults to false.
 *   - {Number} [maxRedirects]: The maximum number of redirects to follow, defaults to 10.
 *   - {Function(options)} [beforeRequest]: Before request hook, you can change every thing here.
 *   - {Boolean} [streaming]: let you get the res object when request connected, default is `false`. alias `customResponse`
 *   - {Boolean} [gzip]: Accept gzip response content and auto decode it, default is `false`.
 * @param {Function} [callback], callback(error, data, res). If missing callback, will return a promise object.
 * @return {HttpRequest} req object.
 * @api public
 */
exports.request = function (url, args, callback) {
  // request(url, callback)
  if (arguments.length === 2 && typeof args === 'function') {
    callback = args;
    args = null;
  }
  if (typeof callback === 'function') {
    return exports.requestWithCallback(url, args, callback);
  }

  // Promise
  if (!_Promise) {
    _Promise = require('native-or-bluebird');
  }
  return new _Promise(function (resolve, reject) {
    exports.requestWithCallback(url, args, makeCallback(resolve, reject));
  });
};

// alias to curl
exports.curl = exports.request;

function makeCallback(resolve, reject) {
  return function (err, data, res) {
    if (err) {
      return reject(err);
    }
    resolve({
      data: data,
      status: res.statusCode,
      headers: res.headers,
      res: res
    });
  };
}

// yield urllib.requestThunk(url, args)
exports.requestThunk = function (url, args) {
  return function (callback) {
    exports.requestWithCallback(url, args, function (err, data, res) {
      if (err) {
        return callback(err);
      }
      callback(null, {
        data: data,
        status: res.statusCode,
        headers: res.headers,
        res: res
      });
    });
  };
};

exports.requestWithCallback = function (url, args, callback) {
  // requestWithCallback(url, callback)
  if (arguments.length === 2 && typeof args === 'function') {
    callback = args;
    args = null;
  }

  args = args || {};
  if (REQUEST_ID >= MAX_VALUE) {
    REQUEST_ID = 0;
  }
  var reqId = ++REQUEST_ID;

  if (args.emitter) {
    args.emitter.emit('request', {
      requestId: reqId,
      url: url,
      args: args,
    });
  }

  args.timeout = args.timeout || exports.TIMEOUT;
  args.maxRedirects = args.maxRedirects || 10;
  args.streaming = args.streaming || args.customResponse;
  var requestStartTime = Date.now();
  var parsedUrl = typeof url === 'string' ? urlutil.parse(url) : url;

  var method = (args.type || args.method || parsedUrl.method || 'GET').toUpperCase();
  var port = parsedUrl.port || 80;
  var httplib = http;
  var agent = args.agent || exports.agent;
  var fixJSONCtlChars = !!args.fixJSONCtlChars;

  if (parsedUrl.protocol === 'https:') {
    httplib = https;
    agent = args.httpsAgent || exports.httpsAgent;
    if (args.httpsAgent === false) {
      agent = false;
    }
    if (!parsedUrl.port) {
      port = 443;
    }
  }

  if (args.agent === false) {
    agent = false;
  }

  var options = {
    host: parsedUrl.hostname || parsedUrl.host || 'localhost',
    path: parsedUrl.path || '/',
    method: method,
    port: port,
    agent: agent,
    headers: args.headers || {}
  };

  var sslNames = [
    'pfx',
    'key',
    'passphrase',
    'cert',
    'ca',
    'ciphers',
    'rejectUnauthorized',
    'secureProtocol',
    'secureOptions',
  ];
  for (var i = 0; i < sslNames.length; i++) {
    var name = sslNames[i];
    if (args.hasOwnProperty(name)) {
      options[name] = args[name];
    }
  }

  // don't check ssl
  if (options.rejectUnauthorized === false && !options.hasOwnProperty('secureOptions')) {
    options.secureOptions = require('constants').SSL_OP_NO_TLSv1_2;
  }

  var auth = args.auth || parsedUrl.auth;
  if (auth) {
    options.auth = auth;
  }

  var body = args.content || args.data;
  var isReadAction = method === 'GET' || method === 'HEAD';
  if (!args.content) {
    if (body && !(typeof body === 'string' || Buffer.isBuffer(body))) {
      if (isReadAction) {
        // read: GET, HEAD, use query string
        body = qs.stringify(body);
      } else {
        var contentType = options.headers['Content-Type'] || options.headers['content-type'];
        // auto add application/x-www-form-urlencoded when using urlencode form request
        if (!contentType) {
          if (args.contentType === 'json') {
            contentType = 'application/json';
          } else {
            contentType = 'application/x-www-form-urlencoded';
          }
          options.headers['Content-Type'] = contentType;
        }

        if (contentType === 'application/json') {
          body = JSON.stringify(body);
        } else {
          // 'application/x-www-form-urlencoded'
          body = qs.stringify(body);
        }
      }
    }
  }

  // if it's a GET or HEAD request, data should be sent as query string
  if (isReadAction && body) {
    options.path += (parsedUrl.query ? '&' : '?') + body;
    body = null;
  }

  var requestSize = 0;
  if (body) {
    var length = body.length;
    if (!Buffer.isBuffer(body)) {
      length = Buffer.byteLength(body);
    }
    requestSize = options.headers['Content-Length'] = length;
  }

  if (args.dataType === 'json') {
    options.headers.Accept = 'application/json';
  }

  if (typeof args.beforeRequest === 'function') {
    // you can use this hook to change every thing.
    args.beforeRequest(options);
  }
  var timer = null;
  var __err = null;
  var connected = false; // socket connected or not
  var keepAliveSocket = false; // request with keepalive socket
  var responseSize = 0;
  var responseAborted = false;
  var done = function (err, data, res) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (!callback) {
      console.warn('[urllib:warn] [%s] [worker:%s] %s %s callback twice!!!',
        Date(), process.pid, options.method, url);
      // https://github.com/node-modules/urllib/pull/30
      if (err) {
        console.warn('[urllib:warn] [%s] [worker:%s] %s: %s\nstack: %s',
          Date(), process.pid, err.name, err.message, err.stack);
      }
      return;
    }
    var cb = callback;
    callback = null;
    var statusCode = -1;
    var headers = {};
    if (res) {
      statusCode = res.statusCode;
      headers = res.headers;
    }

    // handle digest auth
    if (statusCode === 401 && headers['www-authenticate']
        && (!args.headers || !args.headers.Authorization) && args.digestAuth) {
      var authenticate = headers['www-authenticate'];
      if (authenticate.indexOf('Digest ') >= 0) {
        debug('Request#%d %s: got digest auth header WWW-Authenticate: %s', reqId, url, authenticate);
        args.headers = args.headers || {};
        args.headers.Authorization = digestAuthHeader(options.method, options.path, authenticate, args.digestAuth);
        debug('Request#%d %s: auth with digest header: %s', reqId, url, args.headers.Authorization);
        if (res.headers['set-cookie']) {
          args.headers.Cookie = res.headers['set-cookie'].join(';');
        }
        return exports.requestWithCallback(url, args, cb);
      }
    }

    var requestUsetime = Date.now() - requestStartTime;
    debug('[%sms] done, %s bytes HTTP %s %s %s %s',
      requestUsetime, responseSize, statusCode, options.method, options.host, options.path);

    var response = {
      status: statusCode,
      statusCode: statusCode,
      headers: headers,
      size: responseSize,
      aborted: responseAborted,
      rt: requestUsetime,
      keepAliveSocket: keepAliveSocket,
      data: data
    };

    if (err) {
      var agentStatus = '';
      if (agent && typeof agent.getCurrentStatus === 'function') {
        // add current agent status to error message for logging and debug
        agentStatus = ', agent status: ' + JSON.stringify(agent.getCurrentStatus());
      }
      err.message += ', ' + options.method + ' ' + url + ' ' + statusCode
        + ' (connected: ' + connected + ', keepalive socket: ' + keepAliveSocket + agentStatus + ')'
        + '\nheaders: ' + JSON.stringify(headers);
      err.data = data;
      err.path = options.path;
      err.status = statusCode;
      err.headers = headers;
      err.res = response;
    }

    cb(err, data, args.streaming ? res : response);

    if (args.emitter) {
      args.emitter.emit('response', {
        requestId: reqId,
        error: err,
        ctx: args.ctx,
        req: {
          url: url,
          socket: req && req.connection,
          options: options,
          size: requestSize,
        },
        res: response
      });
    }
  };

  var handleRedirect = function (res) {
    var err = null;
    if (args.followRedirect && statuses.redirect[res.statusCode]) {  // handle redirect
      args._followRedirectCount = (args._followRedirectCount || 0) + 1;
      if (!res.headers.location) {
        err = new Error('Got statusCode ' + res.statusCode + ' but cannot resolve next location from headers');
        err.name = 'FollowRedirectError';
      } else if (args._followRedirectCount > args.maxRedirects) {
        err = new Error('Exceeded maxRedirects. Probably stuck in a redirect loop ' + url);
        err.name = 'MaxRedirectError';
      } else {
        var _url = urlutil.resolve(url, res.headers.location);
        debug('Request#%d %s: `redirected` from %s to %s', reqId, options.path, url, _url);
        // make sure timer stop
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        // should pass done instead of callback
        exports.request(_url, args, done);
        return {
          redirect: true,
          error: null
        };
      }
    }
    return {
      redirect: false,
      error: err
    };
  };

  // set user-agent
  if (!options.headers['User-Agent'] && !options.headers['user-agent']) {
    options.headers['User-Agent'] = USER_AGENT;
  }

  if (args.gzip) {
    if (!options.headers['Accept-Encoding'] || !options.headers['accept-encoding']) {
      options.headers['Accept-Encoding'] = 'gzip';
    }
  }

  var decodeContent = function (res, body, cb) {
    var encoding = res.headers['content-encoding'];
    if (body.length === 0) {
      return cb(null, body, encoding);
    }

    if (!encoding || encoding.toLowerCase() !== 'gzip') {
      return cb(null, body, encoding);
    }

    debug('gunzip %d length body', body.length);
    zlib.gunzip(body, cb);
  };

  var writeStream = args.writeStream;

  debug('Request#%d %s %s with headers %j, options.path: %s',
    reqId, method, url, options.headers, options.path);
  var req = httplib.request(options, function (res) {
    debug('Request#%d %s `req response` event emit: status %d, headers: %j',
      reqId, url, res.statusCode, res.headers);

    if (args.streaming) {
      var result = handleRedirect(res);
      if (result.redirect) {
        res.resume();
        return;
      }
      if (result.error) {
        res.resume();
        return done(result.error, null, res);
      }

      return done(null, null, res);
    }

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
      var result = handleRedirect(res);
      if (result.redirect) {
        res.resume();
        return;
      }
      if (result.error) {
        res.resume();
        // end ths stream first
        writeStream.end();
        return done(result.error, null, res);
      }
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

    res.on('data', function (chunk) {
      debug('Request#%d %s: `res data` event emit, size %d', reqId, url, chunk.length);
      responseSize += chunk.length;
      chunks.push(chunk);
    });

    // res.on('close', function () {
    //   debug('Request#%d %s: `res close` event emit, total size %d',
    //     reqId, url, responseSize);
    // });

    // res.on('error', function () {
    //   debug('Request#%d %s: `res error` event emit, total size %d',
    //     reqId, url, responseSize);
    // });

    res.on('aborted', function () {
      responseAborted = true;
      debug('Request#%d %s: `res aborted` event emit, total size %d',
        reqId, url, responseSize);
    });

    res.on('end', function () {
      var body = Buffer.concat(chunks, responseSize);
      debug('Request#%d %s: `res end` event emit, total size %d, _dumped: %s',
        reqId, url, responseSize, res._dumped);

      if (__err) {
        // req.abort() after `res data` event emit.
        return done(__err, body, res);
      }

      var result = handleRedirect(res);
      if (result.error) {
        return done(result.error, body, res);
      }
      if (result.redirect) {
        return;
      }

      decodeContent(res, body, function (err, data, encoding) {
        if (err) {
          return done(err, body, res);
        }
        // if body not decode, dont touch it
        if (!encoding && TEXT_DATA_TYPES.indexOf(args.dataType) >= 0) {
          // try to decode charset
          try {
            data = decodeBodyByCharset(data, res);
          } catch (e) {
            debug('decodeBodyByCharset error: %s', e);
            // if error, dont touch it
            return done(null, data, res);
          }

          if (args.dataType === 'json') {
            if (responseSize === 0) {
              data = null;
            } else {
              var r = parseJSON(data, fixJSONCtlChars);
              if (r.error) {
                err = r.error;
              } else {
                data = r.data;
              }
            }
          }
        }

        if (responseAborted) {
          // err = new Error('Remote socket was terminated before `response.end()` was called');
          // err.name = 'RemoteSocketClosedError';
          debug('Request#%d %s: Remote socket was terminated before `response.end()` was called', reqId, url);
        }

        done(err, data, res);
      });
    });
  });

  var abortRequest = function () {
    debug('Request#%d %s abort, connected: %s', reqId, url, connected);
    // it wont case error event when req haven't been assigned a socket yet.
    if (!req.socket) {
      __err.noSocket = true;
      done(__err);
    }
    req.abort();
  };

  var timeout = ms(args.timeout);

  timer = setTimeout(function () {
    timer = null;
    var msg = 'Request timeout for ' + timeout + 'ms';
    var errorName = connected ? 'ResponseTimeoutError' : 'ConnectionTimeoutError';
    if (!req.socket) {
      errorName = 'SocketAssignTimeoutError';
      msg += ', working sockets is full';
    }
    __err = new Error(msg);
    __err.name = errorName;
    __err.requestId = reqId;
    debug('Request#%d %s %s: %s, connected: %s', reqId, url, __err.name, msg, connected);
    abortRequest();
  }, timeout);

  req.once('socket', function (socket) {
    // https://github.com/iojs/io.js/blob/v1.x/lib/net.js#L342
    if (socket.readyState === 'opening') {
      socket.once('connect', function () {
        debug('Request#%d %s new socket connected', reqId, url);
        connected = true;
      });
      return;
    }

    debug('Request#%d %s reuse socket connected', reqId, url);
    connected = true;
    keepAliveSocket = true;
  });

  req.on('error', function (err) {
    if (err.name === 'Error') {
      err.name = connected ? 'ResponseError' : 'RequestError';
    }
    err.message += ' (req "error")';
    debug('Request#%d %s `req error` event emit, %s: %s', reqId, url, err.name, err.message);
    done(__err || err);
  });

  if (writeStream) {
    writeStream.once('error', function (err) {
      err.message += ' (writeStream "error")';
      __err = err;
      debug('Request#%d %s `writeStream error` event emit, %s: %s', reqId, url, err.name, err.message);
      abortRequest();
    });
  }

  if (args.stream) {
    args.stream.pipe(req);
    args.stream.once('error', function (err) {
      err.message += ' (stream "error")';
      __err = err;
      debug('Request#%d %s `readStream error` event emit, %s: %s', reqId, url, err.name, err.message);
      abortRequest();
    });
  } else {
    req.end(body);
  }

  req.requestId = reqId;
  return req;
};

var JSONCtlCharsMap = {
  '"': '\\"',       // \u0022
  '\\': '\\\\',     // \u005c
  '\b': '\\b',      // \u0008
  '\f': '\\f',      // \u000c
  '\n': '\\n',      // \u000a
  '\r': '\\r',      // \u000d
  '\t': '\\t'       // \u0009
};
var JSONCtlCharsRE = /[\u0000-\u001F\u005C]/g;

function _replaceOneChar(c) {
  return JSONCtlCharsMap[c] || '\\u' + (c.charCodeAt(0) + 0x10000).toString(16).substr(1);
}

function replaceJSONCtlChars(str) {
  return str.replace(JSONCtlCharsRE, _replaceOneChar);
}

function parseJSON(data, fixJSONCtlChars) {
  var result = {
    error: null,
    data: null
  };
  if (fixJSONCtlChars) {
    // https://github.com/node-modules/urllib/pull/77
    // remote the control characters (U+0000 through U+001F)
    data = replaceJSONCtlChars(data);
  }
  try {
    result.data = JSON.parse(data);
  } catch (err) {
    if (err.name === 'SyntaxError') {
      err.name = 'JSONResponseFormatError';
    }
    if (data.length > 1024) {
      // show 0~512 ... -512~end data
      err.message += ' (data json format: ' +
        JSON.stringify(data.slice(0, 512)) + ' ...skip... ' + JSON.stringify(data.slice(data.length - 512)) + ')';
    } else {
      err.message += ' (data json format: ' + JSON.stringify(data) + ')';
    }
    result.error = err;
  }
  return result;
}


function HttpClient(options) {
  EventEmitter.call(this);
  options = options || {};

  if (options.agent) {
    this.agent = options.agent;
    this.hasCustomAgent = true;
  } else {
    this.agent = exports.agent;
    this.hasCustomAgent = false;
  }

  if (options.httpsAgent) {
    this.httpsAgent = options.httpsAgent;
    this.hasCustomHttpsAgent = true;
  } else {
    this.httpsAgent = exports.httpsAgent;
    this.hasCustomHttpsAgent = false;
  }
}
util.inherits(HttpClient, EventEmitter);

HttpClient.prototype.request = HttpClient.prototype.curl = function (url, args, callback) {
  if (typeof args === 'function') {
    callback = args;
    args = null;
  }
  args = args || {};
  args.emitter = this;
  args.agent = args.agent || this.agent;
  args.httpsAgent = args.httpsAgent || this.httpsAgent;
  return exports.request(url, args, callback);
};

HttpClient.prototype.requestThunk = function (url, args) {
  args = args || {};
  args.emitter = this;
  args.agent = args.agent || this.agent;
  args.httpsAgent = args.httpsAgent || this.httpsAgent;
  return exports.requestThunk(url, args);
};

exports.HttpClient = HttpClient;

exports.create = function (options) {
  return new HttpClient(options);
};

/**
 * decode response body by parse `content-type`'s charset
 * @param {Buffer} data
 * @param {Http(s)Response} res
 * @return {String}
 */
function decodeBodyByCharset(data, res) {
  var type = res.headers['content-type'];
  if (!type) {
    return data.toString();
  }

  var type = typer.parse(type);
  var charset = type.parameters.charset || 'utf-8';

  if (!Buffer.isEncoding(charset)) {
    if (!_iconv) {
      _iconv = require('iconv-lite');
    }
    return _iconv.decode(data, charset);
  }

  return data.toString(charset);
}
