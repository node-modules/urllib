/*!
 * urllib - test/iconv.test.js, lib/iconv.js test cases
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Iconv = require('../lib/iconv').Iconv;
var should = require('should');

describe('Iconv test', function() {
  it('#should return Iconv instance', function() {
    var iconv = new Iconv('utf8', 'gbk');
    iconv.convert.should.be.a('function');
    should.ok(Buffer.isBuffer(iconv.convert('你好')));
  });
});