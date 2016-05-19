'use strict';

var urllib = require('./urllib');
var config = {};
var configer = {};

var OPTIONS = [
  'method',
  'type',
  'data',
  'content',
  'stream',
  'writeStream',
  'contentType',
  'dataType',
  'fixJSONCtlChars',
  'headers',
  'timeout',
  'auth',
  'digestAuth',
  'agent',
  'httpsAgent',
  'ca',
  'rejectUnauthorized',
  'pfx',
  'key',
  'cert',
  'passphrase',
  'ciphers',
  'secureProtocol',
  'followRedirect',
  'maxRedirects',
  'beforeRequest',
  'streaming',
  'gzip'
];

// inject configer
OPTIONS.forEach(function(key) {
  configer[key] = function(val) {
    config[key] = val;
    return configer;
  };
});

// wrap urllib.request
configer.request = function(url, args, callback) {
  return urllib.request(url, assign(args, config), callback);
};

// urllib.config
module.exports = function() {
  return function(cfg) {
    assign(config, cfg);
    return configer;
  };
};

// easy assign
function assign(src, arg) {
  src = src || {};
  if (Object.assign) {
    return Object.assign.call(null, src, arg);
  }
  for (var i in arg) {
    src[i] = arg[i];
  }
  return src;
};
