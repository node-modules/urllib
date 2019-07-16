'use strict';

var http = require('http');
var querystring = require('querystring');
var fs = require('fs');
var zlib = require('zlib');
var iconv = require('iconv-lite');
var Busboy = require('busboy');

var server = http.createServer(function (req, res) {
  if (req.url === '/multipart') {
    var busboy = new Busboy({ headers: req.headers });
    var result = {
      files: {},
      form: {},
      headers: req.headers,
      url: req.url,
    };
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
      var size = 0;
      file.on('data', function(data) {
        console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
        size += data.length;
      });
      file.on('end', function() {
        console.log('File [' + fieldname + '] Finished');
        result.files[fieldname] = {
          filename: filename,
          encoding: encoding,
          mimetype: mimetype,
          size: size,
        };
      });
    });
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      console.log('Field [' + fieldname + ']: value: %j', val);
      result.form[fieldname] = val;
    });
    busboy.on('finish', function() {
      console.log('[%s] Done parsing form!', req.method);
      res.statusCode = 200;
      res.end(JSON.stringify(result));
    });
    req.pipe(busboy);
    return;
  }

  if (req.url === '/block') {
    return;
  }

  var chunks  = [];
  var size = 0;
  req.on('data', function (buf) {
    chunks.push(buf);
    size += buf.length;
  });

  req.on('end', function () {
    if (req.url === '/timeout') {
      return setTimeout(function () {
        res.end('timeout 500ms');
      }, 500);
    } else if (req.url === '/response_timeout') {
      res.write('foo');
      return setTimeout(function () {
        res.end('timeout 700ms');
      }, 700);
    } else if (req.url === '/response_timeout_10s') {
      res.write('foo');
      return setTimeout(function () {
        res.end('timeout 10000ms');
      }, 10000);
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
      res.statusCode = 302;
      res.setHeader('Location', '/204');
      return res.end('Redirect to /204');
    } else if (req.url === '/301') {
      res.statusCode = 301;
      res.setHeader('Location', '/204');
      return res.end('I am 301 body');
    } else if (req.url === '/303') {
      res.statusCode = 303;
      res.setHeader('Location', '/204');
      return res.end('Redirect to /204');
    } else if (req.url === '/307') {
      res.statusCode = 307;
      res.setHeader('Location', '/204');
      return res.end('I am 307 body');
    } else if (req.url === '/redirect_no_location') {
      res.statusCode = 302;
      return res.end('I am 302 body');
    } else if (req.url === '/redirect_to_ip') {
      res.statusCode = 302;
      res.setHeader('Location', 'http://10.10.10.10/');
      return res.end('Redirect to http://10.10.10.10/');
    } else if (req.url === '/redirect_to_domain') {
      res.statusCode = 302;
      res.setHeader('Location', 'https://www.google.com/');
      return res.end('Redirect to https://www.google.com/');
    } else if (req.url === '/204') {
      res.statusCode = 204;
      return res.end();
    } else if (req.url === '/loop_redirect') {
      res.statusCode = 302;
      res.setHeader('Location', '/loop_redirect');
      return res.end('Redirect to /loop_redirect');
    } else if (req.url === '/post') {
      res.setHeader('X-Request-Content-Type', req.headers['content-type'] || '');
      res.writeHeader(200);
      return res.end(Buffer.concat(chunks));
    } else if (req.url.indexOf('/get') === 0) {
      res.writeHeader(200);
      return res.end(req.url);
    } else if (req.url.indexOf('/headers') === 0) {
      res.setHeader('content-type', 'application/json');
      res.writeHeader(200);
      return res.end(JSON.stringify(req.headers));
    } else if (req.url === '/wrongjson') {
      res.writeHeader(200);
      return res.end(new Buffer('{"foo":""'));
    } else if (req.url === '/wrongjson-gbk') {
      res.setHeader('content-type', 'application/json; charset=gbk');
      res.writeHeader(200);
      return res.end(fs.readFileSync(__filename));
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
    } else if (req.url === '/stream-timeout') {
      setTimeout(function() {
        res.write('response timeout');
        res.end();
      }, 1000);
      return;
    } else if (req.url.indexOf('/json_mirror') === 0) {
      res.setHeader('Content-Type', req.headers['content-type'] || 'application/json');
      if (req.method === 'GET') {
        res.end(JSON.stringify({
          url: req.url,
          data: Buffer.concat(chunks).toString(),
        }));
      } else {
        res.end(JSON.stringify(JSON.parse(Buffer.concat(chunks))));
      }
      return;
    } else if (req.url.indexOf('/no-gzip') === 0) {
      fs.createReadStream(__filename).pipe(res);
      return;
    } else if (req.url.indexOf('/error-gzip') === 0) {
      res.setHeader('Content-Encoding', 'gzip');
      fs.createReadStream(__filename).pipe(res);
      return;
    } else if (req.url.indexOf('/gzip') === 0) {
      res.setHeader('Content-Encoding', 'gzip');
      fs.createReadStream(__filename).pipe(zlib.createGzip()).pipe(res);
      return;
    } else if (req.url.indexOf('/deflate') === 0) {
      res.setHeader('Content-Encoding', 'deflate');
      fs.createReadStream(__filename).pipe(zlib.createDeflate()).pipe(res);
      return;
    } else if (req.url === '/ua') {
      res.end(JSON.stringify(req.headers));
      return;
    } else if (req.url === '/gbk/json') {
      res.setHeader('Content-Type', 'application/json;charset=gbk');
      var content = iconv.encode(JSON.stringify({hello: '你好'}), 'gbk');
      return res.end(content);
    } else if (req.url === '/gbk/text') {
      res.setHeader('Content-Type', 'text/plain;charset=gbk');
      var content = iconv.encode('你好', 'gbk');
      return res.end(content);
    } else if (req.url === '/errorcharset') {
      res.setHeader('Content-Type', 'text/plain;charset=notfound');
      return res.end('你好');
    } else if (req.url === '/json_with_controls_unicode') {
      return res.end(new Buffer('{"foo":"\b\f\n\r\tbar\u000e!1!\u0086!2!\u0000!3!\u001F!4!\u005C!5!end\u005C\\"}'));
    } else if (req.url === '/json_with_t') {
      return res.end(new Buffer('{"foo":"ba\tr\t\t"}'));
    } else if (req.url === '/u0001.json') {
      res.setHeader('content-type', 'application/json; charset=gbk');
      return res.end(new Buffer(require('./u0001.json').data));
    } else if (req.method === 'DELETE' && req.url.indexOf('/delete-params') === 0) {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        url: req.url,
      }));
    } else if (req.url === '/bigfile') {
      return res.end(new Buffer(1024 * 1024 * 100));
    } else if (req.url === '/headers/accept') {
      return res.end(JSON.stringify({
        accept: req.headers.accept,
      }));
    } else if (req.url === '/headers/xml') {
      return res.end(JSON.stringify({
        'content-type': req.headers['content-type']
      }))
    }

    var url = req.url.split('?');
    var get = querystring.parse(url[1]);
    var ret;
    if (chunks.length > 0) {
      ret = Buffer.concat(chunks).toString();
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

module.exports = server;
