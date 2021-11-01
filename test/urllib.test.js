'use strict';

var assert = require('assert');
var http = require('http');
var querystring = require('querystring');
var urlutil = require('url');
var pedding = require('pedding');
var fs = require('fs');
var path = require('path');
var formstream = require('formstream');
var coffee = require('coffee');
var tar = require('tar');
var mkdirp = require('mkdirp');
var zlib = require('zlib');
var os = require('os');
var through = require('through2');
var Stream = require('stream');
var muk = require('muk'); // muk support more node versions than mm
var spy = require('spy');
var dns = require('dns');
var semver = require('semver');
var server = require('./fixtures/server');
var config = require('./config');
var urllib = require('../');

describe('test/urllib.test.js', function () {
  var host = 'http://127.0.0.1:';
  var port = null;

  before(function (done) {
    server.listen(0, function () {
      port = server.address().port;
      host += port;
      done();
    });
  });

  afterEach(muk.restore);

  after(function (done) {
    setTimeout(function () {
      server.close();
      done();
    }, 1000);
  });

  it('should assert exports', function() {
    assert(urllib.USER_AGENT);
    assert(urllib.agent);
    assert(urllib.httpsAgent);
    assert(urllib.TIMEOUT);
    assert(urllib.TIMEOUTS);
    assert(urllib.request);
    assert(urllib.requestWithCallback);
    assert(urllib.curl);
    assert(urllib.requestThunk);
    assert(urllib.HttpClient);
    assert(urllib.HttpClient2);
    assert(urllib.create);
  });

  it('should_mocked_http_service_works_fine', function (done) {
    urllib.request(host + '/?a=12&code=200', function (error, data, res) {
      assert(!error);
      assert(data instanceof Buffer);
      assert(res.statusCode === 200);
      assert(res.statusMessage === 'OK');
      done();
    });
  });

  describe('requestThunk()', function() {
    it('should mock request error', function(done) {
      urllib.requestThunk('localhost-mock-error:' + (port + 101))(function(err) {
        assert(err);
        done();
      });
    });
  });

  describe('request()', function () {
    it('should request(host-only) work', function(done) {
      urllib.request('127.0.0.1:' + port, function(err, data, res) {
        assert(!err);
        assert(data instanceof Buffer);
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should request(undefined) thrown', function() {
      assert.throws(function () {
        urllib.requestWithCallback(undefined, function() {});
      }, /expect request url to be a string or a http request options, but got undefined/);
    });

    it('should request(1) thrown', function() {
      assert.throws(function () {
        urllib.requestWithCallback(1, function() {});
      }, /expect request url to be a string or a http request options, but got 1/);
    });

    it('should request(localhost:port) work', function(done) {
      urllib.requestWithCallback('localhost:' + port, function(err, data, res) {
        assert(!err);
        assert(data instanceof Buffer);
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should request https success', function (done) {
      var headers = {};
      urllib.request(config.npmRegistry + '/pedding/latest', {
        timeout: 25000,
        headers: headers,
      },
      function (err, data, res) {
        assert(!err);
        assert(Buffer.isBuffer(data));
        assert(res.statusCode === 200);
        assert(res.statusMessage === 'OK');
        // don't touch headers
        assert.deepEqual(headers, {});
        done();
      });
    });

    it('should request https with port success', function (done) {
      urllib.request(config.npmRegistry + ':443/pedding/latest', {
        timeout: 25000,
      },
      function (err, data, res) {
        assert(!err);
        assert(Buffer.isBuffer(data));
        assert(res.statusCode === 200);
        done();
      });
    });

    if (semver.satisfies(process.version, '< 12.0.0')) {
      // FXIME: not support rejectUnauthorized = false on Node.js >= 12.0.0
      it.skip('should request https with rejectUnauthorized:false success', function (done) {
        urllib.request(config.npmRegistry + '/pedding/latest', {
          timeout: 25000,
          rejectUnauthorized: false,
        },
        function (err, data, res) {
          assert(!err);
          assert(Buffer.isBuffer(data));
          assert(res.statusCode === 200);
          done();
        });
      });
    }

    it('should request https disable httpsAgent work', function (done) {
      done = pedding(2, done);
      urllib.request(config.npmRegistry + '/pedding/latest', {
        httpsAgent: false,
        timeout: 25000,
      },
      function (err, data, res) {
        assert(!err);
        assert(Buffer.isBuffer(data));
        assert(res.statusCode === 200);
        done();
      });

      urllib.request(config.npmRegistry + '/pedding/latest', {
        agent: false,
        timeout: 25000,
      },
      function (err, data, res) {
        assert(!err);
        assert(Buffer.isBuffer(data));
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should include res.data', function (done) {
      urllib.request(config.npmRegistry + '/pedding/latest', {timeout: 25000},
      function (err, data, res) {
        assert(!err);
        assert(Buffer.isBuffer(data));
        assert(res.statusCode === 200);
        assert(data === res.data);
        done();
      });
    });

    it('should alias curl() work', function (done) {
      urllib.curl(config.npmRegistry + '/pedding/1.0.0', {timeout: 25000},
      function (err, data, res) {
        assert(!err);
        assert(Buffer.isBuffer(data));
        console.log(res.headers);
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should 301', function (done) {
      urllib.request(host + '/301', function (err, data, res) {
        assert(res.statusCode === 301);
        assert(data.toString() === 'I am 301 body');
        done();
      });
    });

    it('should 302', function (done) {
      urllib.request(host + '/302', {followRedirect: false}, function (err, data, res) {
        assert(res.statusCode === 302);
        assert(res.headers.location === '/204');
        done();
      });
    });

    it('should redirect from 302 to 204', function (done) {
      urllib.request(host + '/302', {followRedirect: true}, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 204);
        done();
      });
    });

    it('should redirect from 307 to 204', function (done) {
      urllib.request(host + '/307', {followRedirect: true}, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 204);
        done();
      });
    });

    it('should redirect from 303 to 204', function (done) {
      urllib.request(host + '/303', {followRedirect: true}, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 204);
        done();
      });
    });

    it('should redirect to a full url and clean up the Host header', function (done) {
      var hostname = urlutil.parse(config.npmRegistry).hostname;
      urllib.request(config.npmRegistry + '/pedding/-/pedding-1.0.0.tgz', {
        followRedirect: true,
        timeout: 30000,
        headers: {
          Host: hostname,
        }
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        // size should be 2107
        assert(res.size === 2107);
        done();
      });
    });

    it('should omit any header that is explicitly set to null', function (done) {
      urllib.request(host + '/headers', {
        headers: {
          DNT: null
        },
        dataType: 'json'
      }, function(err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(!data.dnt);
        assert(!data.DNT);
        done();
      });
    });

    it('should omit accept-encoding header that is explicitly set to null even if option gzip is set to true', function (done) {
      urllib.request(host + '/headers', {
        headers: {
          'Accept-Encoding': null
        },
        gzip: true,
        dataType: 'json'
      }, function(err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(!data['accept-encoding']);
        assert(!data['Accept-Encoding']);
        done();
      });
    });

    if (process.platform !== 'win32') {
      it('should redirect with writeStream and make sure res resume', function (done) {
        coffee.fork(path.join(__dirname, 'redirect.js'))
        .expect('stdout', '404')
        .expect('code', 0)
        .end(done);
      });
    }

    it('should FollowRedirectError', function (done) {
      urllib.request(host + '/redirect_no_location', {followRedirect: true}, function (err, data) {
        assert(err);
        assert(err.name === 'FollowRedirectError');
        assert(err.message.indexOf('Got statusCode 302 but cannot resolve next location from headers, GET http://127.0.0.1:') >= 0);
        assert(data.toString() === 'I am 302 body');
        done();
      });
    });

    it('should MaxRedirectError', function (done) {
      urllib.request(host + '/loop_redirect', {followRedirect: true}, function (err, data) {
        assert(err);
        assert(err.name === 'MaxRedirectError');
        assert(err.message.indexOf('Exceeded maxRedirects. Probably stuck in a redirect loop ') >= 0);
        assert(data.toString() === 'Redirect to /loop_redirect');
        done();
      });
    });

    it('should normalize url', function (done) {
      urllib.request(config.npmRegistry + '/pedding/./1.0.0', function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        done(err);
      });
    });

    describe('ConnectionTimeoutError and ResponseTimeoutError', function () {
      it('should connection timeout', function (done) {
        urllib.request('http://npm.taobao.org', { timeout: 1 }, function (err, data, res) {
          assert(err);
          assert(err.name === 'ConnectionTimeoutError');
          assert(err.message.match(/^Connect timeout for 1ms\, GET http/));
          assert(typeof err.requestId === 'number');
          assert(err.status === -2);
          assert(!data);
          assert(res);
          assert(res.status === -2);
          done();
        });
      });

      it('should response timeout', function (done) {
        urllib.request(host + '/response_timeout', { timeout: 450 }, function (err, data, res) {
          assert(err);
          assert(err.name === 'ResponseTimeoutError');
          assert(err.message.match(/^Response timeout for 450ms\, GET http/));
          assert(typeof err.requestId === 'number');
          assert(data);
          assert(data.toString() === 'foo');
          assert(res);
          assert(res.statusCode === 200);
          done();
        });
      });

      it('can pass two timeout separately and get connect error', function (done) {
        urllib.request('http://npm.taobao.net', { timeout: [1, 10000] }, function (err, data, res) {
          assert(err);
          assert(err.name === 'ConnectionTimeoutError');
          assert(err.message.match(/^Connect timeout for 1ms\, GET http/));
          assert(typeof err.requestId === 'number');
          assert(!data);
          assert(res);
          done();
        });
      });

      it('can pass two timeout separately and get response error', function(done) {
        urllib.request(host + '/response_timeout', { timeout: [1000, 450] }, function (err, data, res) {
          assert(err);
          assert(err.name === 'ResponseTimeoutError');
          assert(err.message.match(/^Response timeout for 450ms\, GET http/));
          assert(typeof err.requestId === 'number');
          assert(data);
          assert(data.toString() === 'foo');
          assert(res);
          assert(res.statusCode === 200);
          done();
        });
      });
    });

    it('should socket hang up by res.socket.destroy() before `response` event emit', function (done) {
      urllib.request(host + '/error', function (err, data, res) {
        assert(err);
        assert(err.name === 'ResponseError');
        assert(err.stack.indexOf('socket hang up') >= 0);
        assert(err.code === 'ECONNRESET');
        assert(!data);
        assert(res);
        done();
      });
    });

    it('should socket hang up by req.abort() before `response` event emit', function (done) {
      var req = urllib.request(host + '/timeout', {timeout: 500}, function (err, data, res) {
        assert(err);
        assert(err.stack.indexOf('socket hang up') >= 0);
        assert(err.code === 'ECONNRESET');
        assert(!data);
        assert(res);
        done();
      });
      setTimeout(function () {
        req.abort();
      }, 1);
    });

    it('should handle server socket end("balabal") will error', function (done) {
      urllib.request(host + '/socket.end.error', function (err, data) {
        assert(err);
        assert(err.name === 'ResponseError');
        err.code && assert(err.code === 'HPE_INVALID_CHUNK_SIZE');
        assert(/Parse Error.*GET http:\/\/127\.0\.0\.1:/.test(err.message) >= 0);
        assert(err.bytesParsed === 2);
        assert(!data);
        done();
      });
    });

    it('should get data', function (done) {
      var params = {
        type: 'get',
        data: {
          sql: 'SELECT * from table',
          data: '呵呵',
        }
      };
      urllib.request(host + '/get', params, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        var info = urlutil.parse(data.toString(), true);
        assert(info.pathname === '/get');
        assert(info.query.sql === params.data.sql);
        assert(info.query.data === params.data.data);
        done();
      });
    });

    it('should get data with options', function (done) {
      var params = {
        data: {
          sql: 'SELECT * from table',
          data: '呵呵',
        }
      };
      var options = {
        path: '/get',
        port: port,
      };
      urllib.request(options, params, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        var info = urlutil.parse(data.toString(), true);
        assert(info.pathname === '/get');
        assert(info.query.sql === params.data.sql);
        assert(info.query.data === params.data.data);
        done();
      });
    });

    it('should get data with args.beforeRequest(options) to change query string', function (done) {
      var params = {
        data: {
          sql: 'SELECT * from table',
          data: '呵呵',
        },
        beforeRequest: function (options) {
          options.path += '&foo=bar';
        }
      };
      var options = {
        path: '/get',
        port: port,
      };
      urllib.request(options, params, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        var info = urlutil.parse(data.toString(), true);
        assert(info.pathname === '/get');
        assert(info.query.sql === params.data.sql);
        assert(info.query.data === params.data.data);
        assert(info.query.foo === 'bar');
        done();
      });
    });

    it('should concat query string and data correctly when GET', function (done) {
      urllib.request(host + '/get?that=in_path', {
        type: 'get',
        data: {
          'should_not': 'be_covered',
          'by': 'data',
        }
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(data.toString() === '/get?that=in_path&should_not=be_covered&by=data');
        done();
      });
    });

    it('should post data with options', function (done) {
      var params = {
        data: {
          sql: 'SELECT * from table',
          data: '哈哈',
        }
      };
      var options = {
        path: '/post',
        method: 'post',
        port: port,
      };
      urllib.request(options, params, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        data = querystring.parse(data.toString());
        assert(data.sql === params.data.sql);
        assert(data.data === params.data.data);
        done();
      });
    });

    it('can post xml', function(done){
      var params = {
        content: '<xml></xml>',
        contentType: 'application/xml'
      };
      var options = {
        path: '/post',
        method: 'post',
        port: port
      };
      urllib.request(options, params, function(err, data, res){
        assert(!err);
        assert(res.statusCode === 200);
        assert(data.toString() === '<xml></xml>');

        done();
      });
    });

    it('should post/put/patch data and auto add "application/x-www-form-urlencoded" Content-Type header',
    function (done) {
      done = pedding(3, done);
      var params1 = {
        type: 'POST',
        data: {
          sql: 'SELECT * from table',
          data: '哈哈',
        }
      };
      var check = function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(res.headers['x-request-content-type'] === 'application/x-www-form-urlencoded');
        data = querystring.parse(data.toString());
        assert(data.sql === params1.data.sql);
        assert(data.data === params1.data.data);
        done();
      };

      urllib.request(host + '/post', params1, check);
      var params2 = {
        type: 'put',
        data: {
          sql: 'SELECT * from table',
          data: '哈哈',
        }
      };
      urllib.request(host + '/post', params2, check);
      var params3 = {
        type: 'patch',
        data: {
          sql: 'SELECT * from table',
          data: '哈哈',
        }
      };
      urllib.request(host + '/post', params3, check);
    });

    it('should post data don\'t support nested object', function (done) {
      var params = {
        type: 'POST',
        data: {
          foo: { bar: 'foo' },
        },
      };
      urllib.request(host + '/post', params, function (err, data) {
        assert(!err);
        assert(data.toString() === 'foo=');
        done();
      });
    });

    it('should post data with form type support nested with nestedQuerystring', function (done) {
      var params = {
        type: 'POST',
        data: {
          foo: { bar: 'foo' },
        },
        nestedQuerystring: true,
      };
      urllib.request(host + '/post', params, function (err, data) {
        assert(!err);
        assert(data.toString() === 'foo%5Bbar%5D=foo');
        done();
      });
    });

  it('should post data with custom Content-Type "test-foo-encode"',
    function (done) {
      var params = {
        type: 'POST',
        data: {
          sql: 'SELECT * from table',
          data: '哈哈',
        },
        headers: {
          'Content-Type': 'test-foo-encode',
        }
      };
      urllib.request(host + '/post', params, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(res.headers['x-request-content-type'] === 'test-foo-encode');
        data = querystring.parse(data.toString());
        assert(data.sql === params.data.sql);
        assert(data.data === params.data.data);
        done();
      });
    });

    it('should trust lower-case header keys and not covered by auto-added headers', function (done) {
      var params = {
        type: 'POST',
        data: {
          sql: 'SELECT * from table',
          data: '哈哈',
        },
        headers: {
          'content-type': 'test-foo-encode',
        }
      };
      urllib.request(host + '/post', params, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(res.headers['x-request-content-type'] === 'test-foo-encode');
        data = querystring.parse(data.toString());
        assert(data.sql === params.data.sql);
        assert(data.data === params.data.data);
        done();
      });
    });

    it('should post big data with params.content', function (done) {
      var bigdata = Buffer.alloc(1024 * 1024);
      urllib.request(host + '/post', {
        type: 'post',
        content: bigdata,
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(data.length === bigdata.length);
        done();
      });
    });

    it('should post big data with params.data', function (done) {
      var bigdata = Buffer.alloc(1024 * 1024);
      urllib.request(host + '/post', {
        type: 'post',
        data: bigdata,
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(data.length === bigdata.length);
        done();
      });
    });

    it('should post big data with params.data and SlowBuffer', function (done) {
      var bigdata = new require('buffer').SlowBuffer(1024 * 1024);
      urllib.request(host + '/post', {
        type: 'post',
        data: bigdata,
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(data.length === bigdata.length);
        done();
      });
    });

    it('should handle GET /wrongjson with dataType=json', function (done) {
      urllib.request(host + '/wrongjson', {
        dataType: 'json',
      }, function (err, data, res) {
        assert(err);
        assert(err.name === 'JSONResponseFormatError');
        assert(err.message.indexOf('Unexpected end ') >= 0);
        assert(res.statusCode === 200);
        assert(data.toString() === '{"foo":""');
        done();
      });
    });

    it('should handle GET /wrongjson-gbk with dataType=json and data size > 1024', function (done) {
      urllib.request(host + '/wrongjson-gbk', {
        dataType: 'json',
      }, function (err, data, res) {
        assert(err);
        assert(err.name === 'JSONResponseFormatError');
        assert(err.message.indexOf('Unexpected token ') >= 0);
        assert(err.message.indexOf('" ...skip... "') >= 0);
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should support options.dataType=text', function (done) {
      urllib.request(host + '/wrongjson', {
        dataType: 'text',
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(data === '{"foo":""');
        done();
      });
    });

    it('should support options.auth', function (done) {
      urllib.request(host + '/auth', {
        type: 'get',
        dataType: 'json',
        auth: 'fengmk2:pass',
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert.deepEqual(data, {user: 'fengmk2', password: 'pass'});
        done();
      });
    });

    it('should support http://user:pass@hostname', function (done) {
      urllib.request(host.replace('://', '://fengmk2:123456@') + '/auth', {
        type: 'get',
        dataType: 'json',
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert.deepEqual(data, {user: 'fengmk2', password: '123456'});
        done();
      });
    });

    it('should auto set accept headers when dataType = json and accept not exists', function(done) {
      urllib.request(host + '/headers/accept', {
        dataType: 'json',
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(data.accept === 'application/json');
        done();
      });
    });

    it('should keep exists accept headers when dataType = json', function(done) {
      urllib.request(host + '/headers/accept', {
        dataType: 'json',
        headers: {
          accept: 'foo/json',
        },
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(data.accept === 'foo/json');
        done();
      });
    });

    it('should only set one content-length', function (done) {
      urllib.request(host + '/headers', {
        method: 'post',
        dataType: 'json',
        headers: {
          'content-length': '10',
        },
        data: {
          foo: 'bar11111111111111',
        },
        beforeRequest(options) {
          assert(options.headers['content-length'] === '21');
          assert(!options.headers['Content-Length']);
        }
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        done();
      });
    });

    describe('mock sockets full', function () {
      var agent = new http.Agent({
        maxSockets: 1,
      });

      it('should case timeout after sockets link full', function (done) {
        done = pedding(2, done);

        var errCount = 0;
        urllib.request(host + '/timeout', {agent: agent, timeout: 1000}, function (err, data) {
          assert(!err);
          assert(errCount === 1);
          errCount = -1;
          assert(data.toString() === 'timeout 500ms');
          done();
        });

        // this will timeout first
        var req = urllib.request(host + '/timeout', {agent: agent, timeout: 300}, function (err) {
          assert(err);
          assert(err.noSocket);
          assert(err.name === 'SocketAssignTimeoutError');
          assert(errCount === 0);
          errCount++;
          done();
        });
        var reqs = agent.requests[Object.keys(agent.requests)[0]];
        assert(reqs.length === 1);
        assert(reqs[0].requestId === req.requestId);
      });
    });

    describe('support agentkeepalive', function () {
      before(function () {
        var KeepAliveAgent = require('agentkeepalive');
        this.agent = new KeepAliveAgent({
          keepAlive: true,
        });
        this.httpsAgent = new KeepAliveAgent.HttpsAgent({
          keepAlive: true
        });
      });

      var urls = [
        config.npmRegistry + '/byte',
        config.npmWeb,
        config.npmRegistry + '/pedding',

        config.npmWeb + '/package/byte',
        config.npmRegistry + '/pedding',
        config.npmWeb + '/package/pedding',
        config.npmRegistry + '/byte',
      ];

      urls.forEach(function (url, index) {
        it('should use KeepAlive agent request ' + url, function (done) {
          var agent = this.agent;
          var httpsAgent = this.httpsAgent;
          urllib.request(url, {
            agent: agent,
            httpsAgent: httpsAgent,
            timeout: 25000,
          }, function (err, data, res) {
            assert(!err);
            assert(data instanceof Buffer);
            if (res.statusCode !== 200) {
              console.log(res.statusCode, res.headers);
            }
            assert(res.headers.connection === 'keep-alive');
            if (index >= 3) {
              assert(res.keepAliveSocket === true);
            }
            done();
          });
        });
      });

      it('should keepAlive with same socket and count socketHandledRequests and socketHandledResponses', function(done) {
        var url = config.npmRegistry + '/pedding/latest';
        var KeepAliveAgent = require('agentkeepalive');
        var agent = new KeepAliveAgent({
          keepAlive: true,
        });
        var httpsAgent = new KeepAliveAgent.HttpsAgent({
          keepAlive: true,
        });
        var index = 0;
        function request() {
          index++;
          urllib.request(url, {
            agent: agent,
            httpsAgent: httpsAgent,
            timeout: 25000,
          }, function (err, data, res) {
            assert(!err);
            assert(data instanceof Buffer);
            if (res.statusCode !== 200) {
              console.log(res.statusCode, res.headers);
            }
            assert(res.headers.connection === 'keep-alive');
            if (index > 1) {
              assert(res.keepAliveSocket === true);
            }
            assert(res.socketHandledRequests === index);
            assert(res.socketHandledResponses === index);
            if (index === 5) {
              return done();
            }
            setTimeout(request, 10);
          });
        }
        request();
      });

      it('should request http timeout', function (done) {
        var agent = this.agent;
        var httpsAgent = this.httpsAgent;
        urllib.request(config.npmHttpRegistry + '/byte/2.0.0', {
          agent: agent,
          httpsAgent: httpsAgent,
          timeout: 25000,
          followRedirect: true,
        }, function (err, data, res) {
          assert(!err);
          assert(data instanceof Buffer);
          assert(res.statusCode === 200);
          // make sure free socket release to free list
          process.nextTick(function () {
            urllib.request(config.npmHttpRegistry + '/npm', {
              agent: agent,
              httpsAgent: httpsAgent,
              timeout: 1,
              followRedirect: true,
            }, function (err) {
              assert(err);
              assert(err.message.indexOf('(connected: true, keepalive socket: true, agent status: {"createSocketCount":') >= 0);
              assert(err.message.indexOf(', socketHandledRequests: ') >= 0);
              assert(err.message.indexOf(', socketHandledResponses: ') >= 0);
              done();
            });
          });
        });
      });

      it('should request https timeout', function (done) {
        var agent = this.agent;
        var httpsAgent = this.httpsAgent;
        urllib.request(config.npmRegistry + '/koa', {
          agent: agent,
          httpsAgent: httpsAgent,
          timeout: 25000,
        }, function (err, data, res) {
          assert(!err);
          assert(data instanceof Buffer);
          assert(res.statusCode === 200);
          assert(res.socketHandledRequests >= 1);
          assert(res.socketHandledResponses >= 1);
          var lastSocketHandledRequests = res.socketHandledRequests;
          var lastSocketHandledResponses = res.socketHandledResponses;
          // make sure free socket release to free list
          process.nextTick(function () {
            urllib.request(config.npmRegistry + '/npm', {
              agent: agent,
              httpsAgent: httpsAgent,
              timeout: 1,
            }, function (err) {
              assert(err);
              assert(err.res.socketHandledRequests === lastSocketHandledRequests + 1);
              // socketHandledResponses should not change
              assert(err.res.socketHandledResponses >= lastSocketHandledResponses);
              assert(err.message.indexOf('(connected: true, keepalive socket: true, agent status: {"createSocketCount":') >= 0);
              done();
            });
          });
        });
      });
    });
  });

  describe('support stream', function () {
    it('should post stream success', function (done) {
      var stat = fs.statSync(__filename);
      var stream = fs.createReadStream(__filename);
      urllib.request(host + '/stream', {
        type: 'POST',
        stream: stream
      }, function (err, data, res) {
        assert(!err);
        assert(data instanceof Buffer);
        assert(data.length === stat.size);
        assert(res.headers['content-length'] === String(stat.size));
        done();
      });
    });

    it('should upload file with formstream', function (done) {
      var form = formstream();
      form.file('file', __filename);
      form.field('hello', '你好urllib');
      var args = {
        type: 'POST',
        headers: form.headers(),
        stream: form
      };
      urllib.request(host + '/stream', args, function (err, data, res) {
        assert(!err);
        data = data.toString();
        assert(data.indexOf('你好urllib\r\n----------------------------') >= 0);
        assert(data.indexOf('Content-Disposition: form-data; name="file"; filename="urllib.test.js"') >= 0);
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should upload file with formstream and timeout', function (done) {
      var form = formstream();
      form.file('file', __filename);
      form.field('hello', '你好urllib');
      var args = {
        type: 'POST',
        headers: form.headers(),
        stream: form,
        timeout: 100,
      };
      urllib.request(host + '/stream-timeout', args, function (err) {
        assert(err.name === 'ResponseTimeoutError');
        done();
      });
    });

    it('should upload file with formstream and response streaming timeout', function (done) {
      var form = formstream();
      form.file('file', __filename);
      form.field('hello', '你好urllib');
      var args = {
        type: 'POST',
        headers: form.headers(),
        stream: form,
        streaming: true,
        timeout: 100,
      };
      urllib.request(host + '/stream-timeout', args, function (err) {
        assert(err.name === 'ResponseTimeoutError');
        done();
      });
    });

    it('should post not exists file stream', function (done) {
      var stream = fs.createReadStream(__filename + 'abc');
      urllib.request(host + '/stream', {
        type: 'POST',
        stream: stream
      }, function (err, data, res) {
        assert(err);
        assert(err.message.indexOf('ENOENT') >= 0);
        assert(err.res === res);
        assert(!data);
        assert(res);
        done();
      });
    });
  });

  describe('args.writeStream', function () {
    var tmpfile = path.join(process.env.TMPDIR || __dirname, 'urllib_writestream.tmp' + process.version);
    it('should store data writeStream with https', function (done) {
      done = pedding(2, done);
      var writeStream = fs.createWriteStream(tmpfile);
      writeStream.on('close', done);
      urllib.request(config.npmWeb, {
        writeStream: writeStream,
        timeout: 25000,
      }, function (err, data, res) {
        assert(!err);
        assert(fs.existsSync(tmpfile));
        assert(data === null);
        assert(res.statusCode === 200);
        assert(fs.statSync(tmpfile).size > 100);
        done();
      });
    });

    it('should timeout emit error', function (done) {
      var writeStream = fs.createWriteStream(tmpfile);
      urllib.request(host + '/bigfile', {
        writeStream: writeStream,
        timeout: 100,
      }, function (err, data, res) {
        assert(err, 'data is ' + (data && data.toString()));
        assert(err.name === 'ResponseTimeoutError');
        assert(!data);
        assert(res);
        done();
      });
    });

    it('should store data writeStream with followRedirect', function (done) {
      done = pedding(2, done);
      var writeStream = fs.createWriteStream(tmpfile);
      writeStream.on('close', function () {
        console.log('writeStream close event');
        done();
      });
      writeStream.on('finish', function () {
        console.log('writeStream finish event');
      });
      urllib.request(config.npmWeb + '/redir-tmp/', {
        writeStream: writeStream,
        followRedirect: true,
        timeout: 25000
      }, function (err, data) {
        assert(!err);
        assert(fs.existsSync(tmpfile));
        assert(data === null);
        assert(fs.statSync(tmpfile).size > 0);
        done();
      });
    });

    it('should return error when writeStream emit error', function (done) {
      var writeStream = fs.createWriteStream('/wrongpath/haha' + tmpfile);
      done = pedding(2, done);
      writeStream.on('error', function () {
        done();
      });
      urllib.request(host + '/writestream', {
        writeStream: writeStream
      }, function (err) {
        assert(err);
        assert(err.message.indexOf('ENOENT') >= 0);
        done();
      });
    });

    it('should end writeStream when server error', function (done) {
      var writeStream = fs.createWriteStream(tmpfile);
      urllib.request(host + '/error', {
        writeStream: writeStream
      }, function (err, data, res) {
        assert(err);
        assert(err.name === 'ResponseError');
        assert(err.stack.match(/socket hang up/));
        assert(err.code === 'ECONNRESET');
        assert(err.message.indexOf('/error -1 (connected: true, keepalive socket: false, socketHandledRequests: 1, socketHandledResponses: 0)\nheaders: {}') >= 0);
        assert(err.res === res);
        assert(!data);
        assert(res);
        assert.deepEqual(Object.keys(res), [
          'status', 'statusCode', 'statusMessage', 'headers', 'size',
          'aborted', 'rt', 'keepAliveSocket', 'data', 'requestUrls', 'timing',
          'remoteAddress', 'remotePort',
          'socketHandledRequests', 'socketHandledResponses',
        ]);
        done();
      });
    });

    it('should end when writeStream is not consumed', function(done) {
      var writeStream = through();
      urllib.request(host, {
        writeStream: writeStream,
        consumeWriteStream: false,
        timeout: 25000,
      }, function (err, data, res) {
        assert(!err);
        assert(data === null);
        assert(res.statusCode === 200);

        var content = '';
        writeStream
        .on('data', function(data) {
          content += data;
        })
        .on('end', function() {
          assert(content.length > 80);
          done();
        });
      });
    });
  });

  describe('args.streaming = true', function () {
    it('should got streaming the response', function (done) {
      urllib.request(config.npmWeb, {
        timeout: 25000,
        streaming: true
      }, function (err, data, res) {
        assert(!err);
        assert(!data);
        var size = 0;
        res.on('data', function (chunk) {
          size += chunk.length;
        });
        res.on('end', function () {
          assert(size > 0);
          done();
        });
      });
    });

    it('should work with alias name customResponse', function (done) {
      urllib.request(config.npmWeb, {
        timeout: 25000,
        customResponse: true
      }, function (err, data, res) {
        assert(!err);
        var size = 0;
        res.on('data', function (chunk) {
          size += chunk.length;
        });
        res.on('end', function () {
          assert(size > 0);
          done();
        });
      });
    });

    it('custom the response data should ok when req error: domain invalid', function (done) {
      urllib.request('https://no-exist/fengmk2/urllib', {
        timeout: 10000,
        customResponse: true
      }, function (err) {
        assert(err);
        console.log(err);
        // EAI_AGAIN on node >= 14
        assert(err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN');
        done();
      });
    });

    it('should follow redirect', function (done) {
      urllib.request(host + '/302-to-200', {
        streaming: true,
        followRedirect: true
      }, function (err, data, res) {
        assert(!err);
        assert(!data);
        assert(res.statusCode === 200);
        assert(!res.headers.location);
        var size = 0;
        res.on('data', function (chunk) {
          size += chunk.length;
        });
        res.on('end', function () {
          assert(size > 0);
          done();
        });
      });
    });

    it('should work with promise', function (done) {
      urllib.request(host + '/302-to-200', {
        timeout: 30000,
        streaming: true,
        followRedirect: true
      }).then(function (result) {
        assert(result.status === 200);
        assert(result.res instanceof Stream);
        var size = 0;
        result.res.on('data', function (chunk) {
          size += chunk.length;
        });
        result.res.on('end', function () {
          assert(size > 0);
          done();
        });
      }).catch(done);
    });

    it('should streaming with ungzip', function (done) {
      var url = config.npmRegistry + '/pedding/-/pedding-1.0.0.tgz';
      urllib.request(url, {
        streaming: true,
        followRedirect: true,
        timeout: 30000,
      }, function (err, _, res) {
        assert(!err);
        assert(res.statusCode === 200);

        var tmpdir = path.join(os.tmpdir(), 'pedding-ungzip2');
        mkdirp.sync(tmpdir);
        var gunzip = zlib.createGunzip();
        gunzip.on('error', done);
        var extracter = tar.x({ cwd: tmpdir });
        extracter.on('error', done);
        extracter.on('end', function () {
          console.log('version %s', require(path.join(tmpdir, 'package/package.json')).version);
          done();
        });
        res.pipe(gunzip).pipe(extracter);
      });
    });
  });

  describe('application/json content-type request', function () {
    it('should auto convert data to json string', function (done) {
      var params = {
        method: 'post',
        data: {
          foo: 'bar',
          n1: 1,
          now: new Date()
        },
        headers: {'Content-Type': 'application/json'},
        dataType: 'json',
      };
      urllib.request(host + '/json_mirror', params, function (err, serverData, res) {
        assert(!err);
        serverData.now = new Date(serverData.now);
        assert.deepEqual(serverData, params.data);
        assert(res.statusCode === 200);
        assert(res.headers['content-type'] === 'application/json');
        done();
      });
    });

    it('should auto convert data to json string with charset', function (done) {
      var params = {
        method: 'post',
        data: {
          foo: 'bar',
          n1: 1,
          now: new Date()
        },
        headers: {'Content-Type': 'application/json; charset=utf-8'},
        dataType: 'json',
      };
      urllib.request(host + '/json_mirror', params, function (err, serverData, res) {
        assert(!err);
        serverData.now = new Date(serverData.now);
        assert.deepEqual(serverData, params.data);
        assert(res.statusCode === 200);
        assert(res.headers['content-type'] === 'application/json; charset=utf-8');
        done();
      });
    });

    it('should convert data to ISO string with qs when method === GET', function (done) {
      var params = {
        method: 'get',
        data: {
          foo: 'bar',
          n1: 1,
          now: new Date()
        },
        headers: {'Content-Type': 'application/json'},
        dataType: 'json',
      };
      urllib.request(host + '/json_mirror', params, function (err, serverData, res) {
        assert(!err);
        assert.deepEqual(serverData, {
          url: '/json_mirror?foo=bar&n1=1&now=',
          data: '',
        });
        assert(res.statusCode === 200);
        assert(res.headers['content-type'] === 'application/json');
        done();
      });
    });
  });

  describe('json contentType request', function () {
    it('should auto convert data to json string', function (done) {
      var params = {
        method: 'post',
        data: {
          foo: 'bar',
          n1: 1,
          now: new Date()
        },
        contentType: 'json',
        dataType: 'json'
      };
      urllib.request(host + '/json_mirror', params, function (err, serverData, res) {
        assert(!err);
        serverData.now = new Date(serverData.now);
        assert.deepEqual(serverData, params.data);
        assert(res.statusCode === 200);
        assert(res.headers['content-type'] === 'application/json');
        done();
      });
    });

    it('should not auto convert data to json string when method = get', function (done) {
      var params = {
        method: 'get',
        data: {
          foo: 'bar',
          n1: 1,
          now: new Date()
        },
        contentType: 'json',
        dataType: 'json'
      };
      urllib.request(host + '/json_mirror', params, function (err, serverData, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(res.headers['content-type'] === 'application/json');
        done();
      });
    });
  });

  describe('gzip content', function () {
    it('should auto accept and decode gzip response content', function (done) {
      urllib.request('https://www.google.com',
        {
          gzip: true,
          timeout: 25000,
          followRedirect: true
        }, function (err, data, res) {
        assert(!err);
        assert(res.headers['content-encoding'] === 'gzip');
        done();
      });
    });

    it('should throw on error gzip content', function (done) {
      urllib.request(host + '/error-gzip',
        {
          gzip: true,
          timeout: 25000,
        }, function (err, data, res) {
        assert(err);
        assert(err.name === 'UnzipError');
        assert(res.headers['content-encoding'] === 'gzip');
        done();
      });
    });

    it('should auto accept and custom decode gzip response content', function (done) {
      done = pedding(4, done);

      urllib.request(config.npmWeb, {
        timeout: 25000,
        headers: {
          'accept-encoding': 'gzip'
        }
      }, function (err, data, res) {
        assert(!err);
        assert(res.headers['content-encoding'] === 'gzip');
        done();
      });

      urllib.request(config.npmWeb, {
        timeout: 25000,
        headers: {
          'Accept-Encoding': 'gzip'
        }
      }, function (err, data, res) {
        assert(!err);
        assert(res.headers['content-encoding'] === 'gzip');
        done();
      });

      urllib.request(config.npmWeb, {
        timeout: 25000,
        gzip: true,
        headers: {
          'accept-encoding': 'gzip'
        }
      }, function (err, data, res) {
        assert(!err);
        assert(res.headers['content-encoding'] === 'gzip');
        done();
      });

      urllib.request(config.npmWeb, {
        timeout: 25000,
        gzip: true,
      }, function (err, data, res) {
        assert(!err);
        assert(res.headers['content-encoding'] === 'gzip');
        done();
      });
    });

    it('should redirect and gzip', function (done) {
      urllib.request(host + '/302-to-gzip', {
        followRedirect: true,
        gzip: true,
        timeout: 25000,
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(res.headers['content-encoding'] === 'gzip');
        done();
      });
    });

    it('should not return gzip response content', function (done) {
      done = pedding(3, done);
      urllib.request(config.npmWeb, {timeout: 30000},
      function (err, data, res) {
        assert(!err);
        assert(!res.headers['content-encoding']);
        done();
      });

      urllib.request(config.npmWeb, {gzip: false, timeout: 30000},
      function (err, data, res) {
        assert(!err);
        assert(!res.headers['content-encoding']);
        done();
      });

      urllib.request(config.npmWeb, {gzip: true, timeout: 30000},
      function (err, data, res) {
        assert(!err);
        assert(res.headers['content-encoding'] === 'gzip');
        done();
      });
    });

    it('should not ungzip content when server not accept gzip', function (done) {
      urllib.request(host + '/no-gzip', {gzip: true}, function (err, data, res) {
        assert(!err);
        assert(!res.headers['content-encoding']);
        done();
      });
    });

    it('should gzip content when server accept gzip', function (done) {
      urllib.request(host + '/gzip', {gzip: true, dataType: 'text'}, function (err, data, res) {
        assert(!err);
        assert(res.headers['content-encoding'] === 'gzip');
        assert(data.indexOf('createServer') > 0);
        done();
      });
    });

    it('should deflate content when server accept deflate', function (done) {
      urllib.request(host + '/deflate', {gzip: true, dataType: 'text'}, function (err, data, res) {
        assert(!err);
        assert(res.headers['content-encoding'] === 'deflate');
        assert(data.indexOf('createServer') > 0);
        done();
      });
    });
  });

  describe('204 status response', function () {
    it('should not convert json data when status 204', function (done) {
      urllib.request(host + '/204', {dataType: 'json'}, function (err, data, res) {
        assert(!err);
        assert(!data);
        assert(res.statusCode === 204);
        done();
      });
    });
  });

  describe('user-agent', function () {
    it('should return default user agent', function (done) {
      urllib.request(host + '/ua', {dataType: 'json'}, function (err, data, res) {
        assert(!err);
        assert(data['user-agent']);
        assert(data['user-agent'].match(/^node\-urllib\/\d+\.\d+\.\d+ Node\.js\/\d+\.\d+\.\d+ \(/));
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should return no user agent if user-agent header is set to null', function (done) {
      urllib.request(host + '/ua', {dataType: 'json', headers: {'user-agent': null}}, function (err, data, res) {
        console.log('data = ', data);
        assert(!err);
        assert(!data['user-agent']);
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should return mock user agent', function (done) {
      urllib.request(host + '/ua', {dataType: 'json', headers: {'user-agent': 'mock agent'}},
      function (err, data, res) {
        assert(!err);
        assert(data['user-agent']);
        assert(data['user-agent'] === 'mock agent');
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should return mock 2 user agent', function (done) {
      urllib.request(host + '/ua', {dataType: 'json', headers: {'User-Agent': 'mock2 agent'}},
      function (err, data, res) {
        assert(!err);
        assert(data['user-agent']);
        assert(data['user-agent'] === 'mock2 agent');
        assert(res.statusCode === 200);
        done();
      });
    });
  });

  describe('on()', function () {
    var urllib = require('../').create();
    afterEach(function () {
      urllib.removeAllListeners('response');
      urllib.removeAllListeners('request');
    });

    it('should listen response event', function (done) {
      done = pedding(4, done);
      urllib.on('response', function (info) {
        if (info.req.options.path === '/error') {
          assert(info.error);
          assert(info.res.status === -1);
          assert(info.req.size >= 0);
          assert.deepEqual(info.ctx, {
            foo: 'error request',
          });
        } else {
          assert(!info.error);
          assert(info.res.status === 200);
          assert(info.req.size === 7);
          assert(info.res.size === info.req.size);
          assert(info.req.options.path === '/stream');
          assert.deepEqual(info.ctx, {
            foo: 'stream request',
          });
          assert(info.req.socket.remoteAddress === '127.0.0.1');
          assert(info.req.socket.remotePort === port);
        }
        done();
      });

      urllib.request(host + '/error', {
        ctx: {
          foo: 'error request'
        }
      }, function (err) {
        assert(err);
        done();
      });

      urllib.request(host + '/stream', {
        method: 'post',
        data: {foo: 'bar'},
        ctx: {
          foo: 'stream request'
        }
      }, function (err) {
        assert(!err);
        done();
      });
    });

    it('should listen request event', function (done) {
      done = pedding(4, done);
      urllib.on('request', function (info) {
        info.args.headers = info.args.headers || {};
        info.args.headers['custom-header'] = 'custom-header';
      });
      urllib.on('response', function (info) {
        assert(info.req.options.headers['custom-header'] === 'custom-header');
        done();
      });

      urllib.request(host + '/error', {
        ctx: {
          foo: 'error request'
        }
      }, function (err) {
        assert(err);
        done();
      });

      urllib.request(host + '/stream', {
        method: 'post',
        data: {foo: 'bar'},
        ctx: {
          foo: 'stream request'
        }
      }, function (err) {
        assert(!err);
        done();
      });
    });

    it('should listen request url is string, when request url is object', function (done) {
      done = pedding(3, done);
      var requestUrl = 'https://cn.bing.com/search?q=nodejs';

      urllib.on('request', function (info) {
        assert(info.url === requestUrl);
        done();
      });

      urllib.on('response', function (info) {
        assert(info.req.url === requestUrl);
        assert(info.res.requestUrls[0] === requestUrl);
        done();
      });

      var urlObj = urlutil.parse(requestUrl);

      urllib.request(urlObj, function (err) {
        assert(!err);
        done();
      });
    });

    it('should trigger req/res in pair when followRedirect', function (done) {
      done = pedding(5, done);
      var redirected = false;
      urllib.on('request', function (info) {
        info.args.headers = info.args.headers || {};
        info.args.headers['custom-header'] = 'custom-header';
        done();
      });
      urllib.on('response', function (info) {
        if (info.req.options.path === '/302-to-200') {
          assert(info.res.status === 302);
          assert(info.res.statusCode === 302);
          redirected = true;
        }
        assert(info.req.options.headers['custom-header'] === 'custom-header');
        assert(redirected);
        done();
      });

      urllib.request(host + '/302-to-200', {
        followRedirect: true,
        ctx: {
          foo: 'error request'
        }
      }, function () {
        done();
      });
    });
  });

  describe('charset support', function () {
    it('should auto decode when dataType = json', function (done) {
      urllib.request(host + '/gbk/json', {
        dataType: 'json'
      }, function (err, data, res) {
        assert(res.headers['content-type'] === 'application/json;charset=gbk');
        assert.deepEqual(data ,{
          hello: '你好'
        });
        done(err);
      });
    });

    it('should auto decode when dataType = text', function (done) {
      urllib.request(host + '/gbk/text', {
        dataType: 'text'
      }, function (err, data, res) {
        assert(res.headers['content-type'] === 'text/plain;charset=gbk');
        assert(data === '你好');
        done(err);
      });
    });

    it('should ignore wrong charset', function (done) {
      urllib.request(host + '/errorcharset', {
        dataType: 'text'
      }, function (err, data, res) {
        assert(res.headers['content-type'] === 'text/plain;charset=notfound');
        assert.deepEqual(data, Buffer.from('你好'));
        done(err);
      });
    });
  });

  if (process.platform !== 'win32') {
    describe('options.socketPath', function() {
      let srv;
      let socketPath;
      beforeEach(function (done) {
        socketPath = path.join(os.tmpdir(), `urllib-${Date.now()}.sock`);
        srv = http.createServer(function (req, resp) {
          resp.end(req.url);
        });
        srv.listen(socketPath, function() {
          done();
        });
      });

      this.afterEach(function() {
        srv.close();
      });

      it('should request socket path', function (done) {
        urllib.request('/ping?hello=world', {
          socketPath,
        }, function (err, data) {
          assert(!err);
          assert.strictEqual(data.toString(), '/?hello=world');
          done();
        });
      });
    });
  }

  describe('options.fixJSONCtlChars = true | false', function () {

    it('should auto fix json control characters', function (done) {
      urllib.request(host + '/json_with_controls_unicode', {
        dataType: 'json',
        fixJSONCtlChars: true,
      }, function (err, data) {
        assert(!err);
        assert.deepEqual(data, {
          foo: '\b\f\n\r\tbar\u000e!1!\u0086!2\!\u0000\!3\!\u001f\!4\!\\\!5\!end\\\\',
        });
        done();
      });
    });

    it('should throw error when response has json control characters', function (done) {
      urllib.request(host + '/json_with_controls_unicode', {
        dataType: 'json',
        // fixJSONCtlChars: false,
      }, function (err, data) {
        assert(err);
        assert(err.name === 'JSONResponseFormatError');
        assert(err.message.indexOf('Unexpected token ') >= 0);
        assert(data === '{"foo":"\b\f\n\r\tbar\u000e!1!\u0086!2!\u0000!3!\u001f!4!\\!5!end\\\\"}');
        done();
      });
    });

  });

  describe('options.fixJSONCtlChars = function', function () {
    it('should fix json string with custom function', function (done) {
      urllib.request(host + '/json_with_t', {
        dataType: 'json',
        fixJSONCtlChars: function(str) {
          return str.replace(/\t/g, '\\t');
        },
      }, function (err, data) {
        assert(!err);
        assert.deepEqual(data, {
          foo: 'ba\tr\t\t',
        });
        done();
      });
    });
  });

  describe('args.stream = stream', function() {
    it('should post stream', function(done) {
      var form = formstream();
      form.file('file1', __filename);
      form.field('hello', '你好urllib');
      var args = {
        timeout: 30000,
        method: 'post',
        dataType: 'json',
        headers: form.headers(),
        stream: form,
      };

      urllib.request(host+ '/multipart', args, function (err, data, res) {
        assert(!err);
        assert(typeof data.files.file1.filename === 'string');
        assert(data.form.hello === '你好urllib');
        assert(res.status === 200);
        done();
      });
    }).timeout(30 * 1000);
  });

  describe('args.dataAsQueryString = true', function() {
    it('should delete params go in query string', function(done) {
      urllib.request(host + '/delete-params', {
        method: 'delete',
        data: {
          foo: 'bar',
        },
        dataType: 'json',
        dataAsQueryString: true,
      }, function(err, data) {
        assert(!err);
        assert(data.url === '/delete-params?foo=bar');
        done();
      });
    });
  });

  describe('headers', function () {
    it('should send lower case by default', function (done) {
      var stub = spy(http, 'request');
      urllib.request(host + '/headers', {
        headers: {
          'Case-Key': 'case1',
          'CASE-KEY': 'case2',
          'lower-key': 'lower',
        },
        dataType: 'json'
      }, function(err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(data['case-key'] === 'case2');
        assert(data['lower-key'] === 'lower');
        assert(!data['Case-key']);
        assert(!data['CASE-KEY']);

        var headers = stub.calls[0].arguments[0].headers;
        assert(headers['case-key'] === 'case2');
        assert(!headers['Case-Key']);
        assert(!headers['CASE-KEY']);
        stub.restore();
        done();
      });
    });

    it('should send origin case', function (done) {
      var stub = spy(http, 'request');
      urllib.request(host + '/headers', {
        headers: {
          'Case-Key': 'case1',
          'CASE-KEY': 'case2',
          'lower-key': 'lower',
        },
        keepHeaderCase: true,
        dataType: 'json'
      }, function(err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(data['case-key'] === 'case2');
        assert(data['lower-key'] === 'lower');
        assert(!data['Case-key']);
        assert(!data['CASE-KEY']);

        var headers = stub.calls[0].arguments[0].headers;
        assert(headers['CASE-KEY'] === 'case2');
        assert(!headers['Case-Key']);
        assert(!headers['case-key']);
        stub.restore();
        done();
      });
    });
  });

  // only test checkAddress in node 8+
  if (parseInt(process.version.slice(1)) >= 8) {
    describe('args.checkAddress', function() {
      it('should throw error when request address illegal', function(done) {
        urllib.request('http://10.10.10.10/foo/bar', {
          checkAddress: function(address) {
            return address !== '10.10.10.10';
          },
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should throw error when request address is ip v6', function(done) {
        urllib.request('http://[2001:0DB8:02de:0000:0000:0000:0000:0e13]/foo/bar', {
          checkAddress: function(address, family) {
            return family !== 6;
          },
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should throw error when follow redirect and redirect address illegal', function(done) {
        urllib.request(host + '/redirect_to_ip', {
          checkAddress: function(address) {
            return address !== '10.10.10.10';
          },
          followRedirect: true,
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should work with domain', function(done) {
        muk(dns, 'lookup', function (host, opts, callback) {
          callback(null, '10.10.10.10');
        });
        urllib.request('http://www.baidu.com/redirect_to_ip', {
          checkAddress: function(address) {
            return address !== '10.10.10.10';
          },
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should work with domain and redirect', function(done) {
        muk(dns, 'lookup', function (host, opts, callback) {
          callback(null, '10.10.10.10');
        });
        urllib.request(host + '/redirect_to_domain', {
          checkAddress: function(address) {
            return address !== '10.10.10.10';
          },
          followRedirect: true,
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should work with custom lookup', function(done) {
        urllib.request('http://www.baidu.com/redirect_to_domain', {
          checkAddress: function(address) {
            return address !== '10.10.10.10';
          },
          lookup: function(host, options, callback) {
            callback(null, '10.10.10.10');
          },
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should work with custom lookup and v6', function(done) {
        urllib.request('http://www.baidu.com/redirect_to_domain', {
          checkAddress: function(address, family) {
            return family !== 6;
          },
          lookup: function(host, options, callback) {
            callback(null, '10.10.10.10', 6);
          },
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should work with domain and redirect', function(done) {
        urllib.request(host + '/redirect_to_domain', {
          checkAddress: function(address) {
            return address !== '10.10.10.10';
          },
          lookup: function(host, options, callback) {
            callback(null, '10.10.10.10');
          },
          followRedirect: true,
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });
    });
  }
});
