'use strict';

var assert = require('assert');
var config = require('./config');
var urllib = require('../');

describe('test/urllib_promise.test.js', function () {
  it('should return promise when callback missing', function () {
    return urllib.request(config.npmWeb, {timeout: 20000})
    .then(function (result) {
      assert(result);
      assert(Object.keys(result), [ 'data', 'status', 'headers', 'res' ]);
      assert(result.data);
      assert(result.res);
      assert(result.data instanceof Buffer);
      assert(result.status === 200);
      assert(result.res.statusCode === 200);
      assert(result.res.headers.connection.toLowerCase() === 'keep-alive');
      assert.deepEqual(Object.keys(result.res), [
        'status', 'statusCode', 'headers',
        'size', 'aborted', 'rt',
        'keepAliveSocket', 'data', 'requestUrls', 'timing',
        'remoteAddress', 'remotePort',
        'socketHandledRequests', 'socketHandledResponses',
      ]);
      assert(result.res.status === 200);
      assert(result.res.rt > 0);
      assert(result.res.size > 0);
    });
  });

  it('should work with args', function () {
    return urllib.request(config.npmWeb, {
      data: {
        q: 'foo'
      },
      timeout: 20000
    })
    .then(function (result) {
      assert(result.data);
      assert(result.res);
      assert(result.data instanceof Buffer);
      assert(result.res.statusCode === 200);
      assert(result.res.headers.connection.toLowerCase() === 'keep-alive');
    });
  });

  it('should throw error', function () {
    return urllib.request('http://127.0.0.1:11', {
      data: {
        q: 'foo'
      },
      timeout: 20000
    })
    .then(function () {
      throw new Error('should not run this');
    }).catch(function (err) {
      assert(err);
      assert(err.code === 'ECONNREFUSED');
      assert(err.status === -1);
      assert.deepEqual(err.headers, {});
      assert.deepEqual(Object.keys(err.res), [
        'status', 'statusCode', 'headers', 'size', 'aborted', 'rt',
        'keepAliveSocket', 'data', 'requestUrls', 'timing', 'remoteAddress', 'remotePort',
        'socketHandledRequests', 'socketHandledResponses',
      ]);
    });
  });
});
