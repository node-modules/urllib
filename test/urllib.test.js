'use strict';

var should = require('should');
var http = require('http');
var querystring = require('querystring');
var urlutil = require('url');
var pedding = require('pedding');
var fs = require('fs');
var path = require('path');
var formstream = require('formstream');
var coffee = require('coffee');
var tar = require('tar');
var zlib = require('zlib');
var os = require('os');
var through = require('through2');
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

  after(function (done) {
    setTimeout(function () {
      server.close();
      done();
    }, 1000);
  });

  it('should_mocked_http_service_works_fine', function (done) {
    urllib.request(host + '/?a=12&code=200', function (error, data, res) {
      should.ok(!error);
      data.should.be.an.instanceof(Buffer);
      res.statusCode.should.eql(200);
      done();
    });
  });

  describe('requestThunk()', function() {
    it('should mock request error', function(done) {
      urllib.requestThunk('localhost-mock-error:' + (port + 101))(function(err) {
        should.exist(err);
        done();
      });
    });
  });

  describe('request()', function () {

    it('should request(host-only) work', function(done) {
      var host = urlutil.parse(config.npmRegistry).host;
      urllib.request(host, { timeout: 30000 }, function(err, data, res) {
        should.not.exist(err);
        data.should.be.a.Buffer;
        res.should.status(200);
        done();
      });
    });

    it('should request(undefined) thrown', function() {
      (function () {
        urllib.requestWithCallback(undefined, function() {});
      }).should.throw('expect request url to be a string or a http request options, but got undefined');
    });

    it('should request(1) thrown', function() {
      (function () {
        urllib.requestWithCallback(1, function() {});
      }).should.throw('expect request url to be a string or a http request options, but got 1');
    });

    it('should request(localhost:port) work', function(done) {
      urllib.requestWithCallback('localhost:' + port, function(err, data, res) {
        should.not.exist(err);
        data.should.be.a.Buffer;
        res.should.status(200);
        done();
      });
    });

    it('should request https success', function (done) {
      urllib.request(config.npmRegistry + '/pedding/*', {
        timeout: 20000,
      },
      function (err, data, res) {
        should.not.exist(err);
        should.ok(Buffer.isBuffer(data));
        res.should.status(200);
        done();
      });
    });

    it('should request https with port success', function (done) {
      urllib.request(config.npmRegistry + ':443/pedding/*', {
        timeout: 20000,
      },
      function (err, data, res) {
        should.not.exist(err);
        should.ok(Buffer.isBuffer(data));
        res.should.status(200);
        done();
      });
    });

    it('should request https with rejectUnauthorized:false success', function (done) {
      urllib.request(config.npmRegistry + '/pedding/*', {
        timeout: 20000,
        rejectUnauthorized: false,
      },
      function (err, data, res) {
        should.not.exist(err);
        should.ok(Buffer.isBuffer(data));
        res.should.status(200);
        done();
      });
    });

    it('should request https disable httpsAgent work', function (done) {
      done = pedding(2, done);
      urllib.request(config.npmRegistry + '/pedding/*', {
        httpsAgent: false,
        timeout: 20000,
      },
      function (err, data, res) {
        should.not.exist(err);
        should.ok(Buffer.isBuffer(data));
        res.should.status(200);
        done();
      });

      urllib.request(config.npmRegistry + '/pedding/*', {
        agent: false,
        timeout: 20000,
      },
      function (err, data, res) {
        should.not.exist(err);
        should.ok(Buffer.isBuffer(data));
        res.should.status(200);
        done();
      });
    });

    it('should include res.data', function (done) {
      urllib.request(config.npmRegistry + '/pedding/*', {timeout: 20000},
      function (err, data, res) {
        should.not.exist(err);
        should.ok(Buffer.isBuffer(data));
        res.should.status(200);
        data.should.equal(res.data);
        done();
      });
    });

    it('should alias curl() work', function (done) {
      urllib.curl(config.npmHttpRegistry + '/pedding/*', {timeout: 20000},
      function (err, data, res) {
        should.not.exist(err);
        should.ok(Buffer.isBuffer(data));
        res.should.status(200);
        done();
      });
    });

    it('should 301', function (done) {
      urllib.request(host + '/301', function (err, data, res) {
        res.should.status(301);
        data.toString().should.equal('I am 301 body');
        done();
      });
    });

    it('should 302', function (done) {
      urllib.request(host + '/302', {followRedirect: false}, function (err, data, res) {
        res.should.status(302);
        res.headers.location.should.eql('/204');
        done();
      });
    });

    it('should redirect from 302 to 204', function (done) {
      urllib.request(host + '/302', {followRedirect: true}, function (err, data, res) {
        should.not.exist(err);
        res.should.status(204);
        done();
      });
    });

    it('should redirect from 307 to 204', function (done) {
      urllib.request(host + '/307', {followRedirect: true}, function (err, data, res) {
        should.not.exist(err);
        res.should.status(204);
        done();
      });
    });

    it('should redirect from 303 to 204', function (done) {
      urllib.request(host + '/303', {followRedirect: true}, function (err, data, res) {
        should.not.exist(err);
        res.should.status(204);
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
        should.not.exist(err);
        res.should.status(200);
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
        should.exist(err);
        err.name.should.equal('FollowRedirectError');
        err.message.should.containEql('Got statusCode 302 but cannot resolve next location from headers, GET http://127.0.0.1:');
        data.toString().should.equal('I am 302 body');
        done();
      });
    });

    it('should MaxRedirectError', function (done) {
      urllib.request(host + '/loop_redirect', {followRedirect: true}, function (err, data) {
        should.exist(err);
        err.name.should.equal('MaxRedirectError');
        err.message.should.containEql('Exceeded maxRedirects. Probably stuck in a redirect loop ');
        data.toString().should.equal('Redirect to /loop_redirect');
        done();
      });
    });

    describe('ConnectionTimeoutError and ResponseTimeoutError', function () {
      it('should connection timeout', function (done) {
        urllib.request('http://npm.taobao.org', { timeout: 1 }, function (err, data, res) {
          should.exist(err);
          err.name.should.equal('ConnectionTimeoutError');
          err.message.should.match(/^Connect timeout for 1ms\, GET http/);
          err.requestId.should.be.instanceof(Number);
          should.not.exist(data);
          should.exist(res);
          done();
        });
      });

      it('should response timeout', function (done) {
        urllib.request(host + '/response_timeout', { timeout: 450 }, function (err, data, res) {
          should.exist(err);
          err.name.should.equal('ResponseTimeoutError');
          err.message.should.match(/^Response timeout for 450ms\, GET http/);
          err.requestId.should.be.instanceof(Number);
          should.exist(data);
          data.toString().should.equal('foo');
          should.exist(res);
          res.should.status(200);
          done();
        });
      });

      it('can pass two timeout seperately and get connect error', function (done) {
        urllib.request('http://npm.taobao.net', { timeout: [1, 10000] }, function (err, data, res) {
          should.exist(err);
          err.name.should.equal('ConnectionTimeoutError');
          err.message.should.match(/^Connect timeout for 1ms\, GET http/);
          err.requestId.should.be.instanceof(Number);
          should.not.exist(data);
          should.exist(res);
          done();
        });
      });

      it('can pass two timeout seperately and get response error', function(done) {
        urllib.request(host + '/response_timeout', { timeout: [1000, 450] }, function (err, data, res) {
          should.exist(err);
          err.name.should.equal('ResponseTimeoutError');
          err.message.should.match(/^Response timeout for 450ms\, GET http/);
          err.requestId.should.be.instanceof(Number);
          should.exist(data);
          data.toString().should.equal('foo');
          should.exist(res);
          res.should.status(200);
          done();
        });
      });
    });

    it('should socket hang up by res.socket.destroy() before `response` event emit', function (done) {
      urllib.request(host + '/error', function (err, data, res) {
        should.exist(err);
        err.name.should.equal('ResponseError');
        err.stack.should.containEql('socket hang up');
        err.code.should.equal('ECONNRESET');
        should.not.exist(data);
        should.exist(res);
        done();
      });
    });

    it('should socket hang up by req.abort() before `response` event emit', function (done) {
      var req = urllib.request(host + '/timeout', {timeout: 500}, function (err, data, res) {
        should.exist(err);
        err.stack.should.containEql('socket hang up');
        err.code.should.equal('ECONNRESET');
        should.not.exist(data);
        should.exist(res);
        done();
      });
      setTimeout(function () {
        req.abort();
      }, 1);
    });

    it('should handle server socket end("balabal") will error', function (done) {
      urllib.request(host + '/socket.end.error', function (err, data) {
        should.exist(err);
        err.name.should.equal('ResponseError');
        err.code && err.code.should.equal('HPE_INVALID_CHUNK_SIZE');
        err.message.should.containEql('Parse Error (req "error"), GET http://127.0.0.1:');
        err.bytesParsed.should.equal(2);
        should.not.exist(data);
        done();
      });
    });

    it('should get data', function (done) {
      var params = {
        type: 'get',
        data: {
          sql: 'SELECT * from table',
          data: '呵呵'
        }
      };
      urllib.request(host + '/get', params, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        var info = urlutil.parse(data.toString(), true);
        info.pathname.should.equal('/get');
        info.query.sql.should.equal(params.data.sql);
        info.query.data.should.equal(params.data.data);
        done();
      });
    });

    it('should get data with options', function (done) {
      var params = {
        data: {
          sql: 'SELECT * from table',
          data: '呵呵'
        }
      };
      var options = {
        path: '/get',
        port: port,
      };
      urllib.request(options, params, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        var info = urlutil.parse(data.toString(), true);
        info.pathname.should.equal('/get');
        info.query.sql.should.equal(params.data.sql);
        info.query.data.should.equal(params.data.data);
        done();
      });
    });

    it('should get data with args.beforeRequest(options) to change query string', function (done) {
      var params = {
        data: {
          sql: 'SELECT * from table',
          data: '呵呵'
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
        should.not.exist(err);
        res.should.status(200);
        var info = urlutil.parse(data.toString(), true);
        info.pathname.should.equal('/get');
        info.query.sql.should.equal(params.data.sql);
        info.query.data.should.equal(params.data.data);
        info.query.foo.should.equal('bar');
        done();
      });
    });

    it('should concat query string and data correctly when GET', function (done) {
      urllib.request(host + '/get?that=in_path', {
        type: 'get',
        data: {
          'should_not': 'be_covered',
          'by': 'data'
        }
      }, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        data.toString().should.equal('/get?that=in_path&should_not=be_covered&by=data');
        done();
      });
    });

    it('should post data with options', function (done) {
      var params = {
        data: {
          sql: 'SELECT * from table',
          data: '哈哈'
        }
      };
      var options = {
        path: '/post',
        method: 'post',
        port: port,
      };
      urllib.request(options, params, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        data = querystring.parse(data.toString());
        data.sql.should.equal(params.data.sql);
        data.data.should.equal(params.data.data);
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
          data: '哈哈'
        }
      };
      var check = function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        res.should.header('X-Request-Content-Type', 'application/x-www-form-urlencoded');
        data = querystring.parse(data.toString());
        data.sql.should.equal(params1.data.sql);
        data.data.should.equal(params1.data.data);
        done();
      };

      urllib.request(host + '/post', params1, check);
      var params2 = {
        type: 'put',
        data: {
          sql: 'SELECT * from table',
          data: '哈哈'
        }
      };
      urllib.request(host + '/post', params2, check);
      var params3 = {
        type: 'patch',
        data: {
          sql: 'SELECT * from table',
          data: '哈哈'
        }
      };
      urllib.request(host + '/post', params3, check);
    });

    it('should post data with custom Content-Type "test-foo-encode"',
    function (done) {
      var params = {
        type: 'POST',
        data: {
          sql: 'SELECT * from table',
          data: '哈哈'
        },
        headers: {
          'Content-Type': 'test-foo-encode'
        }
      };
      urllib.request(host + '/post', params, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        res.should.header('X-Request-Content-Type', 'test-foo-encode');
        data = querystring.parse(data.toString());
        data.sql.should.equal(params.data.sql);
        data.data.should.equal(params.data.data);
        done();
      });
    });

    it('should trust lower-case header keys and not covered by auto-added headers', function (done) {
      var params = {
        type: 'POST',
        data: {
          sql: 'SELECT * from table',
          data: '哈哈'
        },
        headers: {
          'content-type': 'test-foo-encode'
        }
      };
      urllib.request(host + '/post', params, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        res.should.header('X-Request-Content-Type', 'test-foo-encode');
        data = querystring.parse(data.toString());
        data.sql.should.equal(params.data.sql);
        data.data.should.equal(params.data.data);
        done();
      });
    });

    it('should post big data with params.content', function (done) {
      var bigdata = new Buffer(1024 * 1024);
      urllib.request(host + '/post', {
        type: 'post',
        content: bigdata
      }, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        data.should.length(bigdata.length);
        done();
      });
    });

    it('should post big data with params.data', function (done) {
      var bigdata = new Buffer(1024 * 1024);
      urllib.request(host + '/post', {
        type: 'post',
        data: bigdata
      }, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        data.should.length(bigdata.length);
        done();
      });
    });

    it('should post big data with params.data and SlowBuffer', function (done) {
      var bigdata = new require('buffer').SlowBuffer(1024 * 1024);
      urllib.request(host + '/post', {
        type: 'post',
        data: bigdata
      }, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        data.should.length(bigdata.length);
        done();
      });
    });

    it('should handle GET /wrongjson with dataType=json', function (done) {
      urllib.request(host + '/wrongjson', {
        dataType: 'json'
      }, function (err, data, res) {
        should.exist(err);
        err.name.should.equal('JSONResponseFormatError');
        err.message.should.containEql('Unexpected end ');
        res.should.status(200);
        data.toString().should.equal('{"foo":""');
        done();
      });
    });

    it('should handle GET /wrongjson-gbk with dataType=json and data size > 1024', function (done) {
      urllib.request(host + '/wrongjson-gbk', {
        dataType: 'json'
      }, function (err, data, res) {
        should.exist(err);
        err.name.should.equal('JSONResponseFormatError');
        err.message.should.containEql('Unexpected token ');
        err.message.should.containEql('" ...skip... "');
        res.should.status(200);
        done();
      });
    });

    it('should support options.dataType=text', function (done) {
      urllib.request(host + '/wrongjson', {
        dataType: 'text'
      }, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        data.should.equal('{"foo":""');
        done();
      });
    });

    it('should support options.auth', function (done) {
      urllib.request(host + '/auth', {
        type: 'get',
        dataType: 'json',
        auth: 'fengmk2:pass'
      }, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        data.should.eql({user: 'fengmk2', password: 'pass'});
        done();
      });
    });

    it('should support http://user:pass@hostname', function (done) {
      urllib.request(host.replace('://', '://fengmk2:123456@') + '/auth', {
        type: 'get',
        dataType: 'json',
      }, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        data.should.eql({user: 'fengmk2', password: '123456'});
        done();
      });
    });

    describe('mock sockets full', function () {
      var agent = new http.Agent({
        maxSockets: 1
      });

      it('should case timeout after sockets link full', function (done) {
        done = pedding(2, done);

        var errCount = 0;
        urllib.request(host + '/timeout', {agent: agent, timeout: 550}, function (err, data) {
          should.not.exist(err);
          errCount.should.equal(1);
          errCount = -1;
          data.toString().should.equal('timeout 500ms');
          done();
        });

        // this will timeout first
        var req = urllib.request(host + '/timeout', {agent: agent, timeout: 300}, function (err) {
          should.exist(err);
          err.noSocket.should.equal(true);
          err.name.should.equal('SocketAssignTimeoutError');
          errCount.should.equal(0);
          errCount++;
          done();
        });
        var reqs = agent.requests[Object.keys(agent.requests)[0]];
        reqs.should.length(1);
        reqs[0].requestId.should.equal(req.requestId);
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
        config.npmHttpRegistry + '/pedding',

        config.npmWeb + '/package/byte',
        config.npmRegistry + '/pedding',
        config.npmWeb + '/package/pedding',
        config.npmHttpRegistry + '/byte',
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
            should.not.exist(err);
            data.should.be.an.instanceof(Buffer);
            if (res.statusCode !== 200) {
              console.log(res.statusCode, res.headers);
            }
            res.should.have.header('connection', 'keep-alive');
            if (index >= 3) {
              res.keepAliveSocket.should.equal(true);
            }
            done();
          });
        });
      });

      it('should request http timeout', function (done) {
        var agent = this.agent;
        var httpsAgent = this.httpsAgent;
        urllib.request(config.npmHttpRegistry + '/byte', {
          agent: agent,
          httpsAgent: httpsAgent,
          timeout: 25000,
        }, function (err, data, res) {
          should.not.exist(err);
          data.should.be.an.instanceof(Buffer);
          res.statusCode.should.equal(200);
          // make sure free socket release to free list
          process.nextTick(function () {
            urllib.request(config.npmHttpRegistry + '/npm', {
              agent: agent,
              httpsAgent: httpsAgent,
              timeout: 1,
            }, function (err) {
              should.exist(err);
              err.message.should.containEql('(connected: true, keepalive socket: true, agent status: {"createSocketCount":');
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
          should.not.exist(err);
          data.should.be.an.instanceof(Buffer);
          res.statusCode.should.equal(200);
          // make sure free socket release to free list
          process.nextTick(function () {
            urllib.request(config.npmRegistry + '/npm', {
              agent: agent,
              httpsAgent: httpsAgent,
              timeout: 1,
            }, function (err) {
              should.exist(err);
              err.message.should.containEql('(connected: true, keepalive socket: true, agent status: {"createSocketCount":');
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
        should.not.exist(err);
        data.should.be.an.instanceof(Buffer);
        data.should.length(stat.size);
        res.headers['content-length'].should.equal(String(stat.size));
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
        should.not.exist(err);
        data = data.toString();
        data.should.containEql('你好urllib\r\n----------------------------');
        data.should.containEql('Content-Disposition: form-data; name="file"; filename="urllib.test.js"');
        res.should.status(200);
        done();
      });
    });

    it('should post not exists file stream', function (done) {
      var stream = fs.createReadStream(__filename + 'abc');
      urllib.request(host + '/stream', {
        type: 'POST',
        stream: stream
      }, function (err, data, res) {
        should.exist(err);
        err.message.should.containEql('ENOENT');
        err.res.should.equal(res);
        should.not.exist(data);
        should.exist(res);
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
        timeout: 15000,
      }, function (err, data, res) {
        should.not.exist(err);
        should.ok(fs.existsSync(tmpfile));
        should.ok(data === null);
        res.should.status(200);
        fs.statSync(tmpfile).size.should.above(100);
        // fs.readFileSync(tmpfile, 'utf8').should.equal(fs.readFileSync(__filename, 'utf8'));
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
        timeout: 20000
      }, function (err, data) {
        should.not.exist(err);
        should.ok(fs.existsSync(tmpfile));
        should.ok(data === null);
        fs.statSync(tmpfile).size.should.above(0);
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
        should.exist(err);
        err.message.should.containEql('ENOENT');
        done();
      });
    });

    it('should end writeStream when server error', function (done) {
      var writeStream = fs.createWriteStream(tmpfile);
      urllib.request(host + '/error', {
        writeStream: writeStream
      }, function (err, data, res) {
        should.exist(err);
        err.name.should.equal('ResponseError');
        err.stack.should.match(/socket hang up/);
        err.code.should.equal('ECONNRESET');
        err.message.should.containEql('/error -1 (connected: true, keepalive socket: false)\nheaders: {}');
        err.res.should.equal(res);
        should.not.exist(data);
        should.exist(res);
        res.should.have.keys('status', 'statusCode', 'headers', 'size', 'rt', 'aborted', 'keepAliveSocket', 'data', 'requestUrls');
        done();
      });
    });

    it('should end when writeStream is not consumed', function(done) {
      var writeStream = through();
      urllib.request(config.npmWeb, {
        writeStream: writeStream,
        consumeWriteStream: false,
        timeout: 15000,
      }, function (err, data, res) {
        should.not.exist(err);
        should.ok(data === null);
        res.should.status(200);

        var content = '';
        writeStream
        .on('data', function(data) {
          content += data;
        })
        .on('end', function() {
          new Buffer(content).length.should.above(100);
          done();
        });
      });
    });
  });

  describe('args.streaming = true', function () {
    it('should got streaming the response', function (done) {
      urllib.request(config.npmWeb, {
        timeout: 10000,
        streaming: true
      }, function (err, data, res) {
        should.not.exist(err);
        should.not.exist(data);
        var size = 0;
        res.on('data', function (chunk) {
          size += chunk.length;
        });
        res.on('end', function () {
          size.should.above(0);
          done();
        });
      });
    });

    it('should work with alias name customResponse', function (done) {
      urllib.request(config.npmWeb, {
        timeout: 10000,
        customResponse: true
      }, function (err, data, res) {
        should.not.exist(err);
        var size = 0;
        res.on('data', function (chunk) {
          size += chunk.length;
        });
        res.on('end', function () {
          size.should.above(0);
          done();
        });
      });
    });

    it('custom the response data should ok when req error', function (done) {
      urllib.request('https://no-exist/fengmk2/urllib', {
        timeout: 10000,
        customResponse: true
      }, function (err) {
        should.exist(err);
        err.code.should.equal('ENOTFOUND');
        done();
      });
    });

    it('should follow redirect', function (done) {
      urllib.request(config.npmWeb + '/pedding', {
        timeout: 15000,
        streaming: true,
        followRedirect: true
      }, function (err, data, res) {
        should.not.exist(err);
        should.not.exist(data);
        res.statusCode.should.equal(200);
        should.not.exist(res.headers.location);
        var size = 0;
        res.on('data', function (chunk) {
          size += chunk.length;
        });
        res.on('end', function () {
          size.should.above(0);
          done();
        });
      });
    });

    it('should work with promise', function (done) {
      urllib.request(config.npmWeb + '/pedding', {
        timeout: 30000,
        streaming: true,
        followRedirect: true
      }).then(function (result) {
        result.status.should.equal(200);
        result.res.should.be.a.Stream;
        var size = 0;
        result.res.on('data', function (chunk) {
          size += chunk.length;
        });
        result.res.on('end', function () {
          size.should.above(0);
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
        should.not.exist(err);
        res.statusCode.should.equal(200);

        var tmpdir = path.join(os.tmpdir(), 'pedding-ungzip2');
        var gunzip = zlib.createGunzip();
        gunzip.on('error', done);
        var extracter = tar.Extract({ path: tmpdir });
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
        should.not.exist(err);
        serverData.now = new Date(serverData.now);
        serverData.should.eql(params.data);
        res.should.status(200);
        res.headers.should.have.property('content-type', 'application/json');
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
        headers: {'Content-Type': 'application/json'},
        dataType: 'json',
      };
      urllib.request(host + '/json_mirror', params, function (err, serverData, res) {
        should.not.exist(err);
        serverData.should.eql({
          url: '/json_mirror?foo=bar&n1=1&now=', data: ''
        });
        res.should.status(200);
        res.headers.should.have.property('content-type', 'application/json');
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
        should.not.exist(err);
        serverData.now = new Date(serverData.now);
        serverData.should.eql(params.data);
        res.should.status(200);
        res.headers.should.have.property('content-type', 'application/json');
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
        should.not.exist(err);
        res.should.status(200);
        res.headers.should.have.property('content-type', 'application/json');
        done();
      });
    });
  });

  describe('gzip content', function () {
    it('should auto accept and decode gzip response content', function (done) {
      urllib.request('https://www.baidu.com/',
        {
          gzip: true,
          timeout: 15000,
        }, function (err, data, res) {
        should.not.exist(err);
        res.should.have.header('content-encoding', 'gzip');
        done();
      });
    });

    it('should auto accept and custom decode gzip response content', function (done) {
      done = pedding(4, done);

      urllib.request(config.npmWeb, {
        timeout: 20000,
        headers: {
          'accept-encoding': 'gzip'
        }
      }, function (err, data, res) {
        should.not.exist(err);
        res.should.have.header('content-encoding', 'gzip');
        done();
      });

      urllib.request(config.npmWeb, {
        timeout: 20000,
        headers: {
          'Accept-Encoding': 'gzip'
        }
      }, function (err, data, res) {
        should.not.exist(err);
        res.should.have.header('content-encoding', 'gzip');
        done();
      });

      urllib.request(config.npmWeb, {
        timeout: 20000,
        gzip: true,
        headers: {
          'accept-encoding': 'gzip'
        }
      }, function (err, data, res) {
        should.not.exist(err);
        res.should.have.header('content-encoding', 'gzip');
        done();
      });

      urllib.request(config.npmWeb, {
        timeout: 20000,
        gzip: true,
      }, function (err, data, res) {
        should.not.exist(err);
        res.should.have.header('content-encoding', 'gzip');
        done();
      });
    });

    it('should redirect and gzip', function (done) {
      urllib.request(config.npmWeb + '/pedding',
        {followRedirect: true, gzip: true, timeout: 20000}, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
        res.should.have.header('content-encoding', 'gzip');
        done();
      });
    });

    it('should not return gzip response content', function (done) {
      done = pedding(3, done);
      urllib.request(config.npmWeb, {timeout: 30000},
      function (err, data, res) {
        should.not.exist(err);
        should.not.exist(res.headers['content-encoding']);
        done();
      });

      urllib.request(config.npmWeb, {gzip: false, timeout: 30000},
      function (err, data, res) {
        should.not.exist(err);
        should.not.exist(res.headers['content-encoding']);
        done();
      });

      urllib.request(config.npmWeb, {gzip: true, timeout: 30000},
      function (err, data, res) {
        should.not.exist(err);
        res.should.have.header('content-encoding', 'gzip');
        done();
      });
    });

    it('should not ungzip content when server not accept gzip', function (done) {
      urllib.request(host + '/no-gzip', {gzip: true}, function (err, data, res) {
        should.not.exist(err);
        should.not.exist(res.headers['content-encoding']);
        done();
      });
    });

    it('should gzip content when server accept gzip', function (done) {
      urllib.request(host + '/gzip', {gzip: true}, function (err, data, res) {
        should.not.exist(err);
        res.should.have.header('content-encoding', 'gzip');
        done();
      });
    });
  });

  describe('204 status response', function () {
    it('should not convert json data when status 204', function (done) {
      urllib.request(host + '/204', {dataType: 'json'}, function (err, data, res) {
        should.not.exist(err);
        should.not.exist(data);
        res.should.status(204);
        done();
      });
    });
  });

  describe('user-agent', function () {
    it('should return default user agent', function (done) {
      urllib.request(host + '/ua', {dataType: 'json'}, function (err, data, res) {
        should.not.exist(err);
        should.exist(data['user-agent']);
        data['user-agent'].should.match(/^node\-urllib\/\d+\.\d+\.\d+ Node\.js\/\d+\.\d+\.\d+ \(/);
        res.should.status(200);
        done();
      });
    });

    it('should return mock user agent', function (done) {
      urllib.request(host + '/ua', {dataType: 'json', headers: {'user-agent': 'mock agent'}},
      function (err, data, res) {
        should.not.exist(err);
        should.exist(data['user-agent']);
        data['user-agent'].should.equal('mock agent');
        res.should.status(200);
        done();
      });
    });

    it('should return mock 2 user agent', function (done) {
      urllib.request(host + '/ua', {dataType: 'json', headers: {'User-Agent': 'mock2 agent'}},
      function (err, data, res) {
        should.not.exist(err);
        should.exist(data['user-agent']);
        data['user-agent'].should.equal('mock2 agent');
        res.should.status(200);
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
          should.exist(info.error);
          info.res.status.should.equal(-1);
          info.req.size.should.equal(0);
          info.ctx.should.eql({
            foo: 'error request'
          });
        } else {
          should.not.exist(info.error);
          info.res.status.should.equal(200);
          info.req.size.should.equal(7);
          info.res.size.should.equal(info.req.size);
          info.req.options.path.should.equal('/stream');
          info.ctx.should.eql({
            foo: 'stream request'
          });
          info.req.socket.remoteAddress.should.equal('127.0.0.1');
          info.req.socket.remotePort.should.equal(port);
        }
        done();
      });

      urllib.request(host + '/error', {
        ctx: {
          foo: 'error request'
        }
      }, function (err) {
        should.exist(err);
        done();
      });

      urllib.request(host + '/stream', {
        method: 'post',
        data: {foo: 'bar'},
        ctx: {
          foo: 'stream request'
        }
      }, function (err) {
        should.not.exist(err);
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
        info.req.options.headers['custom-header'].should.equal('custom-header');
        done();
      });

      urllib.request(host + '/error', {
        ctx: {
          foo: 'error request'
        }
      }, function (err) {
        should.exist(err);
        done();
      });

      urllib.request(host + '/stream', {
        method: 'post',
        data: {foo: 'bar'},
        ctx: {
          foo: 'stream request'
        }
      }, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  describe('charset support', function () {
    it('should auto decode when dataType = json', function (done) {
      urllib.request(host + '/gbk/json', {
        dataType: 'json'
      }, function (err, data, res) {
        res.should.have.header('content-type', 'application/json;charset=gbk');
        data.should.eql({
          hello: '你好'
        });
        done(err);
      });
    });

    it('should auto decode when dataType = text', function (done) {
      urllib.request(host + '/gbk/text', {
        dataType: 'text'
      }, function (err, data, res) {
        res.should.have.header('content-type', 'text/plain;charset=gbk');
        data.should.equal('你好');
        done(err);
      });
    });

    it('should ignore wrong charset', function (done) {
      urllib.request(host + '/errorcharset', {
        dataType: 'text'
      }, function (err, data, res) {
        res.should.have.header('content-type', 'text/plain;charset=notfound');
        data.should.eql(new Buffer('你好'));
        done(err);
      });
    });
  });

  describe('options.fixJSONCtlChars = true | false', function () {

    it('should auto fix json control characters', function (done) {
      urllib.request(host + '/json_with_controls_unicode', {
        dataType: 'json',
        fixJSONCtlChars: true,
      }, function (err, data) {
        should.not.exist(err);
        data.should.eql({
          foo: '\b\f\n\r\tbar\u000e!1!\u0086!2\!\u0000\!3\!\u001f\!4\!\\\!5\!end\\\\'
        });
        done();
      });
    });

    it('should throw error when response has json control characters', function (done) {
      urllib.request(host + '/json_with_controls_unicode', {
        dataType: 'json',
        // fixJSONCtlChars: false,
      }, function (err, data) {
        should.exist(err);
        err.name.should.equal('JSONResponseFormatError');
        err.message.should.containEql('Unexpected token ');
        data.should.equal('{"foo":"\b\f\n\r\tbar\u000e!1!\u0086!2!\u0000!3!\u001f!4!\\!5!end\\\\"}');
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
        stream: form
      };

      var url = 'http://httpbin.org/post';
      urllib.request(url, args, function (err, data, res) {
        should.not.exist(err);
        data.files.file1.should.be.a.String;
        data.form.hello.should.equal('你好urllib');
        res.status.should.equal(200);
        done();
      });
    });

  });

});
