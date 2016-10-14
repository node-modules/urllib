'use strict';

var debug = require('debug')('urllib:detect_proxy_agent');
var urlparse = require('url').parse;
var tunnel = require('tunnel-agent');
var getProxyFromURI = require('./get_proxy_from_uri');

function formatProxyTunnelOptions(proxy, args) {
  var tunnelOptions = {
    proxy: {
      host: proxy.hostname,
      port: +proxy.port,
      proxyAuth: proxy.auth,
      headers: args.proxyHeaders,
    },
    headers: args.headers,
    ca: args.ca,
    cert: args.cert,
    key: args.key,
    passphrase: args.passphrase,
    pfx: args.pfx,
    ciphers: args.ciphers,
    rejectUnauthorized: args.rejectUnauthorized,
    secureOptions: args.secureOptions,
    secureProtocol: args.secureProtocol,
  };

  return tunnelOptions;
}

function detectTunnelType(uri, proxy) {
  var uriProtocol = uri.protocol === 'https:' ? 'https' : 'http';
  var proxyProtocol = proxy.protocol === 'https:' ? 'Https' : 'Http';
  return uriProtocol + 'Over' + proxyProtocol;
}

function detectProxyAgent(uri, args) {
  var proxy = args.proxy;
  if (!proxy) {
    proxy = getProxyFromURI(uri);
    if (!proxy) {
      return null;
    }
  }

  if (typeof proxy === 'string') {
    proxy = urlparse(proxy);
  }

  var tunnelOptions = formatProxyTunnelOptions(proxy, args);
  var t = detectTunnelType(uri, proxy);
  debug('get %s proxy: %j', t, tunnelOptions);
  return tunnel[t](tunnelOptions);
}

module.exports = detectProxyAgent;
