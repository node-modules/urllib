/**
 * Module dependencies.
 */

var JSCOV = process.env.JSCOV === '1';
if (JSCOV) {
  var jscoverage = require('jscoverage');
  require = jscoverage.require(module);
}

var urllib = require('../', JSCOV);
var should = require('should');
var http = require('http');

/* {{{ private function implode_buffer_chunks() */
function implode_buffer_chunks(chunks) {
  var len = 0;
  for (var i = 0; i < chunks.length; i++) {
    len += chunks[i].length;
  }

  var pos = 0;
  var buf = new Buffer(len);
  for (var i = 0; i < chunks.length; i++) {
    chunks[i].copy(buf, pos);
    pos += chunks[i].length;
  }

  return buf;
}
/* }}} */

/* {{{ mock http server for unittest */

var server = require('http').createServer(function(req, res) {
  var chunks  = [];
  req.on('data', function(buf) {
    chunks.push(buf);
  });

  req.on('end', function() {
    if (req.url === '/timeout') {
      return setTimeout(function() {
        res.writeHeader(200);
        res.end('timeout 500ms');
      }, 500);
    } else if (req.url === '/error') {
      return res.destroy();
    }

    var url = req.url.split('?');
    var get = require('querystring').parse(url[1]);

    if (chunks.length) {
      var ret = implode_buffer_chunks(chunks).toString();
    } else {
      var ret = '<html><head><meta http-equiv="Content-Type" content="text/html;charset=##{charset}##">...</html>';
    }

    chunks  = [];
    res.writeHead(get.code ? get.code : 200, {
      'Content-Type': 'text/html',
    });
    res.end(ret.replace('##{charset}##', get.charset ? get.charset : 'i_am_not_defined'));

  });
}).listen(33749);
/* }}} */

describe('urllib.test.js', function() {

  /* {{{ should_mocked_http_service_works_fine() */
  it('should_mocked_http_service_works_fine' ,function(done) {
    urllib.request('http://127.0.0.1:33749?a=12&code=302', function(error, data, res) {
      should.ok(!error);
      data.should.be.an.instanceof(Buffer);
      res.statusCode.should.eql(302);
      done();
    });
  });
  /* }}} */

  /* {{{ should_return_charset_works_fine() */
  it('should_return_charset_works_fine', function(done) {
    var charset = ['gb2312', 'gbk', 'utf-8'];

    var waitnum = charset.length + 1;
    charset.forEach(function(item) {
      urllib.request('http://127.0.0.1:33749?code=200&charset=' + item, function(error, data, res) {
        should.ok(!error);
        item.should.eql(urllib.getCharset(res, data));
        if ((--waitnum) < 1) {
          done();
        }
      });
    });

    var options = {
      'type': 'POST',
      'data': '<html><meta http-equiv="refresh" content="0;url=http://www.baidu.com/"></html>',
    };
    urllib.request('http://127.0.0.1:33749', options, function(error, data, res) {
      if ((--waitnum) < 1) {
        done();
      }
    });
  
  });
  /* }}} */

  describe('#request()', function() {
    it('should 301', function(done) {
      urllib.request('http://google.com', function(err, data, res) {
        res.should.status(301);
        done();
      });
    });
    it('should 302', function(done) {
      urllib.request('http://t.cn/zOJdq1R', function(err, data, res) {
        res.should.status(302);
        done();
      });
    });
    it('should 500ms timeout', function(done) {
      urllib.request('http://127.0.0.1:33749/timeout', { timeout: 450 }, function(err, data, res) {
        should.exist(err);
        err.name.should.equal('RequestTimeoutError');
        err.stack.should.match(/^RequestTimeoutError: socket hang up, request timeout for 450ms\./);
        err.code.should.equal('ECONNRESET');
        should.not.exist(data);
        should.not.exist(res);
        done();
      });
    });
    it('should error', function(done) {
      urllib.request('http://127.0.0.1:33749/error', function(err, data, res) {
        should.exist(err);
        err.name.should.equal('RequestError');
        err.stack.should.match(/^RequestError: socket hang up/);
        err.code.should.equal('ECONNRESET');
        should.not.exist(data);
        should.not.exist(res);
        done();
      });
    });
  });

});

after(function() {
  server.close();
});
