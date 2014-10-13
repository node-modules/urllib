/**!
 * urllib - test/fixtures/server.js
 *
 * Copyright(c) 2011 - 2014 fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

"use strict";

/**
 * Module dependencies.
 */

var should = require('should');
var http = require('http');
var querystring = require('querystring');
var fs = require('fs');
var zlib = require('zlib');
var iconv = require('iconv-lite');

var server = http.createServer(function (req, res) {
  // req.headers['user-agent'].should.match(/^node\-urllib\/\d+\.\d+\.\d+ node\//);
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
    } else if (req.url === '/redirect_no_location') {
      res.statusCode = 302;
      return res.end('I am 302 body');
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
    } else if (req.url.indexOf('/json_mirror') === 0) {
      res.setHeader('Content-Type', req.headers['content-type']);
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
    } else if (req.url.indexOf('/gzip') === 0) {
      res.setHeader('Content-Encoding', 'gzip');
      fs.createReadStream(__filename).pipe(zlib.createGzip()).pipe(res);
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
