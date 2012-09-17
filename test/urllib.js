/**
 * Module dependencies.
 */

var urllib = require('../');
var should = require('should');
var http = require('http');
var querystring = require('querystring');
var urlutil = require('url');

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
  req.on('data', function (buf) {
    chunks.push(buf);
  });

  req.on('end', function () {
    if (req.url === '/timeout') {
      return setTimeout(function () {
        res.writeHeader(200);
        res.end('timeout 500ms');
      }, 500);
    } else if (req.url === '/error') {
      return res.destroy();
    } else if (req.url === '/302') {
      res.writeHeader(302);
      return res.end();
    } else if (req.url === '/301') {
      res.writeHeader(301);
      return res.end('I am 301 body');
    } else if (req.url === '/post') {
      res.writeHeader(200);
      return res.end(implode_buffer_chunks(chunks));
    } else if (req.url.indexOf('/get') === 0) {
      res.writeHeader(200);
      return res.end(req.url);
    } else if (req.url === '/wrongjson') {
      res.writeHeader(200);
      return res.end('{"foo":""');
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
}).listen(33749);

describe('urllib.test.js', function () {

  var host = 'http://127.0.0.1:33749';

  after(function () {
    server.close();
  });

  it('should_mocked_http_service_works_fine', function (done) {
    urllib.request(host + '/?a=12&code=302', function (error, data, res) {
      should.ok(!error);
      data.should.be.an.instanceof(Buffer);
      res.statusCode.should.eql(302);
      done();
    });
  });

  describe('urllib.getCharset()', function () {

    var charsets = [ 'gb2312', 'gbk', 'utf-8' ];
    charsets.forEach(function (charset) {
      it('should return ' + charset, function (done) {
        urllib.request(host + '/?code=200&charset=' + charset, function (err, data, res) {
          should.not.exist(err);
          charset.should.equal(urllib.getCharset(res, data));
          done();
        });
      });
    });

    it('should return null', function (done) {
      var options = {
        type: 'POST',
        content: '<html><meta http-equiv="refresh" content="0;url=http://www.baidu.com/"></html>',
      };
      urllib.request(host, options, function (err, data, res) {
        should.not.exist(err);
        should.not.exist(urllib.getCharset(res, data));
        done();
      });
    });

    it('should return gbk in html meta header', function (done) {
      var options = {
        type: 'POST',
        content: '<html><meta http-equiv="Content-Type" content="text/html; charset=gbk"></html>',
      };
      urllib.request(host, options, function (err, data, res) {
        should.not.exist(err);
        urllib.getCharset(res, data).should.equal('gbk');
        done();
      });
    });
  });

  describe('#request()', function () {
    // it('should request https success', function (done) {
    //   urllib.request('https://www.alipay.com/', function (err, data, res) {
    //     should.not.exist(err);
    //     res.should.status(200);
    //     done();
    //   });
    // });

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
        err.stack.should.match(/^RequestTimeoutError: socket hang up, request timeout for 450ms\./);
        err.code.should.equal('ECONNRESET');
        should.not.exist(data);
        should.not.exist(res);
        done();
      });
    });
    it('should error', function (done) {
      urllib.request(host + '/error', function (err, data, res) {
        should.exist(err);
        err.name.should.equal('RequestError');
        err.stack.should.match(/^RequestError: socket hang up/);
        err.code.should.equal('ECONNRESET');
        should.not.exist(data);
        should.not.exist(res);
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

    it('should post data', function (done) {
      var params = {
        type: 'POST',
        data: {
          sql: 'SELECT * from table',
          data: '哈哈'
        }
      };
      urllib.request(host + '/post', params, function (err, data, res) {
        should.not.exist(err);
        res.should.status(200);
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
  });

  describe('https request', function () {
    it('GET github search user api', function (done) {
      urllib.request('https://api.github.com/legacy/user/search/location:china', {dataType: 'json'},
      function (err, data, res) {
        should.not.exist(err);
        data.should.have.property('users');
        data.users.length.should.above(0);
        res.should.status(200);
        res.headers['content-type'].should.include('json');
        done();
      });
    });
  });

});