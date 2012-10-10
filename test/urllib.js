/**
 * Module dependencies.
 */

var urllib = process.env.URLLIB_COV ? require('../lib-cov/urllib') : require('../lib/urllib');
var should = require('should');
var http = require('http');
var querystring = require('querystring');
var urlutil = require('url');
var KeepAliveAgent = require('agentkeepalive');
var pedding = require('pedding');

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
    } else if (req.url === '/auth') {
      var auth = new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString().split(':');
      res.writeHeader(200);
      return res.end(JSON.stringify({user: auth[0], password: auth[1]}));
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

  describe('request()', function () {
    it('should request https success', function (done) {
      urllib.request('https://www.alipay.com/', function (err, data, res) {
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
          'http://s.taobao.com/search?spm=1.1000386.220544.1.39f990&q=%C2%E3%D1%A5&refpid=420460_1006&source=tbsy&style=grid&tab=all',
          'http://s.taobao.com/search?spm=1.1000386.220544.5.39f990&q=%C7%EF%B4%F2%B5%D7%C9%C0&refpid=420464_1006&source=tbsy&pdc=true&style=grid',
          'http://s.taobao.com/search?spm=a230r.1.6.3.d2f979&q=%C5%A3%D7%D0%BF%E3%C5%AE&style=grid&tab=all&source=tbsy&refpid=420467_1006&newpre=null&p4p_str=fp_midtop%3D0%26firstpage_pushleft%3D0&cps=yes&from=compass&cat=50103042&navlog=compass-3-c-50103042',
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

  describe('https request', function () {
    it('GET github search user api', function (done) {
      urllib.request('https://api.github.com/legacy/user/search/location:china', {dataType: 'json'},
      function (err, data, res) {
        should.not.exist(err);
        data.should.have.property('users');
        data.users.length.should.above(0);
        res.should.status(200);
        res.should.have.header('content-type', 'application/json; charset=utf-8');
        done();
      });
    });
  });

});