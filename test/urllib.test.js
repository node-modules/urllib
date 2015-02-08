/**!
 * urllib - test/urllib.test.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var http = require('http');
var zlib = require('zlib');
var querystring = require('querystring');
var urlutil = require('url');
var pedding = require('pedding');
var fs = require('fs');
var path = require('path');
var formstream = require('formstream');
var semver = require('semver');
var server = require('./fixtures/server');
var urllib = require('../');

describe('urllib.test.js', function () {

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

  describe('request()', function () {
    it('should request https success', function (done) {
      urllib.request('https://www.nodejitsu.com/npm/', {timeout: 10000}, function (err, data, res) {
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
        res.should.status(204);
        done();
      });
    });

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
      it('should 500ms connection timeout', function (done) {
        urllib.request(host + '/timeout', { timeout: 450 }, function (err, data, res) {
          should.exist(err);
          err.name.should.equal('ConnectionTimeoutError');
          err.message.should.match(/^Request#\d+ timeout for 450ms\, GET http/);
          should.not.exist(data);
          should.exist(res);
          done();
        });
      });

      it('should 500ms response timeout', function (done) {
        urllib.request(host + '/response_timeout', { timeout: 450 }, function (err, data, res) {
          should.exist(err);
          err.name.should.equal('ResponseTimeoutError');
          err.message.should.match(/^Request#\d+ timeout for 450ms\, GET http/);
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
        err.name.should.equal('RequestError');
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
        err.name.should.equal('RequestError');
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
        err.name.should.equal('RequestError');
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
        err.message.should.containEql('Unexpected end of input, GET http://127.0.0.1:');
        res.should.status(200);
        data.toString().should.equal('{"foo":""');
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

    // only test agentkeepalive on node >= 0.11.12
    if (semver.gte(process.version.substring(1), '0.11.12')) {
      describe('support agentkeepalive', function () {
        before(function () {
          var KeepAliveAgent = require('agentkeepalive');
          this.agent = new KeepAliveAgent({
            keepAlive: true,
          });
        });

        var urls = [
          'https://opbeat.com/',
          'https://www.nodejitsu.com',
          'https://opbeat.com/about',
          'https://www.nodejitsu.com/npm/',
          // 'https://www.npmjs.org/search?q=urllib',
          // 'http://www.taobao.com/sitemap.php',
          // 'http://nodejs.org/',
          // 'http://cnpmjs.org/',

          // 'https://www.npmjs.org/package/urllib',
          // 'https://www.npmjs.org/',
          // 'http://www.taobao.com/',
          // 'http://nodejs.org/docs/latest/api/https.html',
          // 'http://cnpmjs.org/package/urllib',
        ];

        urls.forEach(function (url) {
          it('should use KeepAlive agent request ' + url, function (done) {
            var agent = this.agent;
            urllib.request(url, {
              agent: agent,
              timeout: 15000,
            }, function (err, data, res) {
              should.not.exist(err);
              data.should.be.an.instanceof(Buffer);
              if (res.statusCode !== 200) {
                console.log(res.statusCode, res.headers);
              }
              res.should.have.header('connection', 'keep-alive');
              done();
            });
          });
        });
      });
    }
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
      urllib.request('https://github.com/', {
        writeStream: writeStream,
        timeout: 10000,
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
      urllib.request('http://test.webdav.org/redir-tmp/', {
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
        err.name.should.equal('RequestError');
        err.stack.should.match(/socket hang up/);
        err.code.should.equal('ECONNRESET');
        err.message.should.containEql('/error -1\nheaders: {}');
        err.res.should.equal(res);
        should.not.exist(data);
        should.exist(res);
        res.should.have.keys('status', 'statusCode', 'headers', 'size', 'rt', 'aborted');
        done();
      });
    });

  });

  describe('args.customResponse', function () {
    it('custom the response data', function (done) {
      urllib.request('http://www.taobao.com', {
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
      }, function (err, data, res) {
        err.code.should.equal('ENOTFOUND');
        done();
      });
    });
  });

  describe('https request', function () {
    it('GET github page', function (done) {
      urllib.request('https://github.com/node-modules/urllib', { timeout: 15000 },
      function (err, data, res) {
        should.not.exist(err);
        data.toString().should.containEql('node-modules/urllib');
        res.should.status(200);
        res.should.have.header('content-type', 'text/html; charset=utf-8');
        done();
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
      urllib.request('https://registry.npmjs.org/byte',
        {dataType: 'json', gzip: true, timeout: 10000}, function (err, data, res) {
        should.not.exist(err);
        data.name.should.equal('byte');
        // res.should.have.header('content-encoding', 'gzip');
        res.should.have.header('content-type', 'application/json');
        done();
      });
    });

    it('should auto accept and custom decode gzip response content', function (done) {
      urllib.request('https://www.nodejitsu.com/company/contact/', {
        dataType: 'json', gzip: true, timeout: 10000,
        headers: {
          'accept-encoding': 'gzip'
        }
      }, function (err, data, res) {
        should.not.exist(err);
        data.should.be.a.Buffer;
        data.length.should.above(0);
        res.should.have.header('content-encoding', 'gzip');
        zlib.gunzip(data, function (err, buf) {
          should.not.exist(err);
          buf.should.be.a.Buffer;
          done();
        });
      });
    });

    it.skip('should redirect and gzip', function (done) {
      urllib.request('http://dist.u.qiniudn.com/v0.10.1/SHASUMS.txt',
        {followRedirect: true, gzip: true, timeout: 10000}, function (err, data, res) {
        should.not.exist(err);
        data.toString().should.containEql('e213170fe5ec7721b31149fba1a7a691c50b5379');
        res.should.status(200);
        // res.should.have.header('content-encoding', 'gzip');
        // res.should.have.header('content-type', 'text/plain');
        done();
      });
    });

    it.skip('should not ungzip binary content', function (done) {
      urllib.request('http://dist.u.qiniudn.com/v0.10.0/node.exp', {gzip: true, timeout: 10000},
      function (err, data, res) {
        should.not.exist(err);
        should.not.exist(res.headers['content-encoding']);
        res.should.have.header('content-type', 'application/octet-stream');
        done();
      });
    });

    it('should not return gzip response content', function (done) {
      done = pedding(3, done);
      urllib.request('https://www.nodejitsu.com/company/contact/', {timeout: 10000},
      function (err, data, res) {
        should.not.exist(err);
        should.not.exist(res.headers['content-encoding']);
        done();
      });

      urllib.request('https://www.nodejitsu.com/company/contact/', {gzip: false, timeout: 10000},
      function (err, data, res) {
        should.not.exist(err);
        should.not.exist(res.headers['content-encoding']);
        done();
      });

      urllib.request('https://www.nodejitsu.com/company/contact/', {gzip: true, timeout: 10000},
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
        data['user-agent'].should.match(/^node\-urllib\/\d+\.\d+\.\d+ node\//);
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
});
