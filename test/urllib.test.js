/**
 * Module dependencies.
 */

var urllib = require('../');
var should = require('should');
var http = require('http');
var querystring = require('querystring');
var urlutil = require('url');
var KeepAliveAgent = require('agentkeepalive');
var pedding = require('pedding');
var fs = require('fs');
var path = require('path');
var formstream = require('formstream');

function implode_buffer_chunks(chunks) {
  var i, len = 0;
  for (i = 0; i < chunks.length; i++) {
    len += chunks[i].length;
  }

  var pos = 0;
  var buf = new Buffer(len);
  for (i = 0; i < chunks.length; i++) {
    chunks[i].copy(buf, pos);
    pos += chunks[i].length;
  }

  return buf;
}

var server = require('http').createServer(function (req, res) {
  var chunks  = [];
  var size = 0;
  req.on('data', function (buf) {
    chunks.push(buf);
    size += buf.length;
  });

  req.on('end', function () {
    if (req.url === '/timeout') {
      return setTimeout(function () {
        res.writeHeader(200);
        res.end('timeout 500ms');
      }, 500);
    } else if (req.url === '/error') {
      return res.destroy();
    } else if (req.url === '/socket.destroy') {
      res.write('foo haha\n');
      setTimeout(function () {
        res.write('foo haha 2');
        setTimeout(function () {
          res.destroy();
        }, 300);
      }, 200);
      return;
    } else if (req.url === '/socket.end') {
      res.write('foo haha\n');
      setTimeout(function () {
        res.write('foo haha 2');
        setTimeout(function () {
          // res.end();
          res.socket.end();
          // res.socket.end('foosdfsdf');
        }, 300);
      }, 200);
      return;
    } else if (req.url === '/socket.end.error') {
      res.write('foo haha\n');
      setTimeout(function () {
        res.write('foo haha 2');
        setTimeout(function () {
          res.socket.end('balabala');
        }, 300);
      }, 200);
      return;
    } else if (req.url === '/302') {
      res.writeHeader(302);
      return res.end();
    } else if (req.url === '/301') {
      res.writeHeader(301);
      return res.end('I am 301 body');
    } else if (req.url === '/post') {
      res.setHeader('X-Request-Content-Type', req.headers['content-type'] || '');
      res.writeHeader(200);
      return res.end(implode_buffer_chunks(chunks));
    } else if (req.url.indexOf('/get') === 0) {
      res.writeHeader(200);
      return res.end(req.url);
    } else if (req.url === '/wrongjson') {
      res.writeHeader(200);
      return res.end('{"foo":""');
    } else if (req.url === '/writestream') {
      var s = fs.createReadStream(__filename);
      return s.pipe(res);
    } else if (req.url === '/auth') {
      var auth = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString().split(':');
      res.writeHeader(200);
      return res.end(JSON.stringify({user: auth[0], password: auth[1]}));
    } else if (req.url === '/stream') {
      res.writeHeader(200, {
        'Content-Length': String(size)
      });
      for (var i = 0; i < chunks.length; i++) {
        res.write(chunks[i]);
      }
      res.end();
      return;
    }

    var url = req.url.split('?');
    var get = querystring.parse(url[1]);
    var ret;
    if (chunks.length > 0) {
      ret = implode_buffer_chunks(chunks).toString();
    } else {
      ret = '<html><head><meta http-equiv="Content-Type" content="text/html;charset=##{charset}##">...</html>';
    }
    chunks  = [];
    res.writeHead(get.code ? get.code : 200, {
      'Content-Type': 'text/html',
    });
    res.end(ret.replace('##{charset}##', get.charset ? get.charset : ''));

  });
});

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
    urllib.request(host + '/?a=12&code=302', function (error, data, res) {
      should.ok(!error);
      data.should.be.an.instanceof(Buffer);
      res.statusCode.should.eql(302);
      done();
    });
  });

  describe('request()', function () {
    it('should request https success', function (done) {
      urllib.request('https://www.alipay.com/', {timeout: 10000}, function (err, data, res) {
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
      urllib.request(host + '/302', function (err, data, res) {
        res.should.status(302);
        done();
      });
    });

    it('should 500ms timeout', function (done) {
      urllib.request(host + '/timeout', { timeout: 450 }, function (err, data, res) {
        should.exist(err);
        err.name.should.equal('RequestTimeoutError');
        err.message.should.match(/^Request#\d+ timeout for 450ms$/);
        should.not.exist(data);
        should.not.exist(res);
        done();
      });
    });

    it('should error', function (done) {
      urllib.request(host + '/error', function (err, data, res) {
        should.exist(err);
        err.name.should.equal('RequestError');
        err.stack.should.include('socket hang up');
        err.code.should.equal('ECONNRESET');
        should.not.exist(data);
        should.not.exist(res);
        done();
      });
    });

    it('should socket.destroy', function (done) {
      urllib.request(host + '/socket.destroy', function (err, data, res) {
        should.not.exist(err);
        data.toString().should.equal('foo haha\nfoo haha 2');
        should.ok(res.aborted);
        done();
      });
    });

    it('should handle server socket end() will normal', function (done) {
      urllib.request(host + '/socket.end', function (err, data, res) {
        should.not.exist(err);
        data.toString().should.equal('foo haha\nfoo haha 2');
        should.ok(res.aborted);
        done();
      });
    });

    it('should handle server socket end("balabal") will error', function (done) {
      urllib.request(host + '/socket.end.error', function (err, data, res) {
        should.exist(err);
        err.name.should.equal('RequestError');
        err.code && err.code.should.equal('HPE_INVALID_CHUNK_SIZE');
        err.message.should.equal('Parse Error');
        err.bytesParsed.should.equal(2);
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
      }
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
        err.name.should.equal('SyntaxError');
        err.message.should.equal('Unexpected end of input');
        res.should.status(200);
        data.toString().should.equal('{"foo":""');
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

    describe('support agentkeepalive', function () {
      before(function () {
        this.agent = new KeepAliveAgent();
      });

      it('should use KeepAlive agent request all urls', function (done) {
        var urls = [
          'http://www.taobao.com/',
          'http://nodejs.org/',
        ];
        var agent = this.agent;
        done = pedding(urls.length, done);
        urls.forEach(function (url) {
          urllib.request(url, {
            agent: agent,
            timeout: 15000,
          }, function (err, data, res) {
            should.not.exist(err);
            data.should.be.an.instanceof(Buffer);
            res.should.status(200);
            res.should.have.header('connection', 'keep-alive');
            done();
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
        data.should.include('你好urllib\r\n----------------------------');
        data.should.include('Content-Disposition: form-data; name="file"; filename="urllib.test.js"');
        done();
      });
    });

    it('should post not exists file stream', function (done) {
      var stat = fs.statSync(__filename);
      var stream = fs.createReadStream(__filename + 'abc');
      urllib.request(host + '/stream', {
        type: 'POST',
        stream: stream
      }, function (err, data, res) {
        should.exist(err);
        err.message.should.include('ENOENT, open');
        should.not.exist(data);
        should.not.exist(res);
        done();
      });
    });
  });

  describe('args.writeStream', function () {
    var tmpfile = path.join(process.env.TMPDIR || __dirname, 'urllib_writestream.tmp' + process.version);

    it('should store data writeStream', function (done) {
      done = pedding(2, done);
      var writeStream = fs.createWriteStream(tmpfile);
      writeStream.on('close', done);
      urllib.request('https://codeload.github.com/TBEDP/urllib/zip/0.3.4', {
        writeStream: writeStream,
      }, function (err, data, res) {
        should.not.exist(err);
        should.ok(fs.existsSync(tmpfile));
        should.ok(data === null);
        res.should.status(200);
        fs.statSync(tmpfile).size.should.equal(55695);
        // fs.readFileSync(tmpfile, 'utf8').should.equal(fs.readFileSync(__filename, 'utf8'));
        done();
      });
    });

    it('should return error when writeStream emit error', function (done) {
      var writeStream = fs.createWriteStream('/wrongpath/haha' + tmpfile);
      urllib.request(host + '/writestream', {
        writeStream: writeStream
      }, function (err, data, res) {
        should.exist(err);
        err.message.should.include('ENOENT, open');
        done();
      });
    });

    it('should error', function (done) {
      var writeStream = fs.createWriteStream(tmpfile);
      urllib.request(host + '/error', {
        writeStream: writeStream
      }, function (err, data, res) {
        should.exist(err);
        err.name.should.equal('RequestError');
        err.stack.should.match(/socket hang up/);
        err.code.should.equal('ECONNRESET');
        should.not.exist(data);
        should.not.exist(res);
        done();
      });
    });

  });

  describe('https request', function () {
    it('GET github page', function (done) {
      urllib.request('https://github.com/TBEDP/urllib', { timeout: 10000 },
      function (err, data, res) {
        should.not.exist(err);
        data.toString().should.include('TBEDP/urllib');
        res.should.status(200);
        res.should.have.header('content-type', 'text/html; charset=utf-8');
        done();
      });
    });
  });

});
