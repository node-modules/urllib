/**!
 * urllib - openssl.test.js
 *
 * Copyright(c) node-modules and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   P.S.V.R <pmq2001@gmail.com> (http://www.ofpsvr.com)
 */

'use strict';

/**
 * This is a test for the bug of unwanted openSSL errors.
 */

var should = require('should');
var urllib = require('../');
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var Agent = require('agentkeepalive');
var HttpsAgent = require('agentkeepalive').HttpsAgent;

var bad_sign = function () {
  // This triggers an implicit error
  // that is recorded onto OpenSSL's error stack
  var privateKey = fs.readFileSync(path.join(__dirname, './fixtures/bad_rsa_privkey.pem'), 'utf8');
  var s = crypto.createSign('sha1');
  var sign = s.sign(privateKey);
};

describe('httpclient.test.js', function () {
  it('should requestThunk()', function (done) {
    var conf = {
      "keepAlive": true,
      "keepAliveTimeout": 300000,
      "timeout": 300000,
      "maxSockets": null,
      "maxFreeSockets": 10,
      "enableStatusLog": false
    };

    var httpAgent = new Agent(conf);
    var httpsAgent = new HttpsAgent(conf);

    var client = urllib.create({
      agent: httpAgent,
      httpsAgent: httpsAgent
    });

    bad_sign();
    // 1st time when we establish a https connection,
    // ~ClearErrorOnReturn is called so the errors of bad_sign() won't be thrown
    client.requestThunk('https://iojs.org')(function (err, result) {
      should.not.exist(err);
      result.data.should.be.a.Buffer;
      result.status.should.equal(200);

      setImmediate(function () {
        // 2nd time when we reuse an existing connection,
        // ~ClearErrorOnReturn will not be called,
        // making the errors of bad_sign() be thrown
        // A fix of this bug should prevent this from happening
        bad_sign();
        client.requestThunk('https://iojs.org')(function (err, result) {
          should.not.exist(err);
          result.data.should.be.a.Buffer;
          result.status.should.equal(200);
          done();
        });
      });
    });
  });
});
