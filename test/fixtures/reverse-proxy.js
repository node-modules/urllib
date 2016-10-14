// https://github.com/nodejitsu/node-http-proxy/blob/master/examples/http/reverse-proxy.js

var http = require('http');
var net = require('net');
var httpProxy = require('http-proxy');
var url = require('url');
var util = require('util');

var proxy = httpProxy.createServer();

var server = http.createServer(function (req, res) {
  console.log('request: Receiving reverse proxy http request for:' + req.url);

  proxy.web(req, res, {target: req.url, secure: false});
});

server.on('connect', function (req, socket) {
  console.log('connect: Receiving reverse proxy https request for:' + req.url);

  var serverUrl = url.parse('https://' + req.url);

  var srvSocket = net.connect(serverUrl.port, serverUrl.hostname, function() {
    socket.write('HTTP/1.1 200 Connection Established\r\n' +
    'Proxy-agent: Node-Proxy\r\n' +
    '\r\n');
    srvSocket.pipe(socket);
    socket.pipe(srvSocket);
  });
});

module.exports = server;

// Test with:
// curl -vv -x http://127.0.0.1:8213 https://www.google.com
// curl -vv -x http://127.0.0.1:8213 http://www.google.com
