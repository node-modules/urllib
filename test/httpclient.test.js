/**!
 * urllib - httpclient.test.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var urllib = require('../');

describe('httpclient.test.js', function () {
  it('should requestThunk()', function (done) {
    var client = urllib.create();
    client.requestThunk('https://nodejs.org')(function (err, result) {
      should.not.exist(err);
      result.data.should.be.a.Buffer;
      result.status.should.equal(200);
      done();
    });
  });
});
