'use strict';

var fs = require('fs');
var assert = require('assert');
var server = require('./fixtures/server');
var urllib = require('..');

describe('test/files.test.js', function() {
  var host = 'http://127.0.0.1:';
  var port = null;
  var url;

  before(function(done) {
    server.listen(0, function() {
      port = server.address().port;
      host += port;
      url = host+ '/multipart';
      done();
    });
  });

  after(function(done) {
    setTimeout(function() {
      server.close();
      done();
    }, 1000);
  });

  it('should upload a file with filepath success', function(done) {
    urllib.request(url, {
      files: __filename,
      dataType: 'json',
    }, function(err, result, res) {
      if (err) {
        return done(err);
      }
      // console.log(result)
      assert(result.headers['content-type'].indexOf('multipart/form-data;') === 0);
      assert(res.status === 200);
      assert(result.files.file.filename === 'files.test.js');
      assert(result.files.file.mimetype === 'application/javascript');
      done();
    });
  });

  it('should upload a file with stream success', function(done) {
    urllib.request(url, {
      files: fs.createReadStream(__filename),
      dataType: 'json',
    }, function(err, result, res) {
      if (err) {
        return done(err);
      }
      assert(result.headers['content-type'].indexOf('multipart/form-data;') === 0);
      assert(res.status === 200);
      assert(result.files.file.filename === 'files.test.js');
      assert(result.files.file.mimetype === 'application/javascript');
      done();
    });
  });

  it('should upload a file with buffer success', function(done) {
    urllib.request(url, {
      files: fs.readFileSync(__filename),
      dataType: 'json',
    }, function(err, result, res) {
      if (err) {
        return done(err);
      }
      assert(result.headers['content-type'].indexOf('multipart/form-data;') === 0);
      assert(res.status === 200);
      assert(result.files.file.filename === 'bufferfile0');
      assert(result.files.file.mimetype === 'application/octet-stream');
      done();
    });
  });

  it('should upload multi file with Array<String|Buffer|Stream> success', function(done) {
    urllib.request(url, {
      files: [ __filename, fs.createReadStream(__filename), fs.readFileSync(__filename) ],
      dataType: 'json',
    }, function(err, result, res) {
      if (err) {
        return done(err);
      }
      assert(result.headers['content-type'].indexOf('multipart/form-data;') === 0);
      assert(res.status === 200);
      assert(result.files.file.filename === 'files.test.js');
      assert(result.files.file.mimetype === 'application/javascript');
      assert(result.files.file1.filename === 'files.test.js');
      assert(result.files.file1.mimetype === 'application/javascript');
      assert(result.files.file2.filename === 'bufferfile2');
      assert(result.files.file2.mimetype === 'application/octet-stream');
      done();
    });
  });

  it('should upload a file with hello field success', function(done) {
    urllib.request(url, {
      files: [ __filename ],
      data: {
        hello: 'hello world',
      },
      dataType: 'json',
    }, function(err, result, res) {
      if (err) {
        return done(err);
      }
      assert(result.headers['content-type'].indexOf('multipart/form-data;') === 0);
      assert(res.status === 200);
      assert(result.files.file.filename === 'files.test.js');
      assert(result.files.file.mimetype === 'application/javascript');
      assert.deepEqual(result.form, {
        hello: 'hello world',
      });
      done();
    });
  });

  it('should upload a custom file field name', function(done) {
    urllib.request(url, {
      files: {
        uploadfile: __filename,
        foo: fs.createReadStream(__filename),
      },
      data: {
        hello: 'hello world',
      },
      dataType: 'json',
    }, function(err, result, res) {
      if (err) {
        return done(err);
      }
      assert(result.headers['content-type'].indexOf('multipart/form-data;') === 0);
      assert(res.status === 200);
      assert(result.files.uploadfile.filename === 'files.test.js');
      assert(result.files.uploadfile.mimetype === 'application/javascript');
      assert(result.files.foo.filename === 'files.test.js');
      assert(result.files.foo.mimetype === 'application/javascript');
      assert.deepEqual(result.form, {
        hello: 'hello world',
      });
      done();
    });
  });

  it('should upload same field name between files and data', function(done) {
    urllib.request(url, {
      files: {
        uploadfile: __filename,
        foo: fs.createReadStream(__filename),
      },
      data: {
        hello: 'hello world',
        foo: 'bar',
      },
      dataType: 'json',
    }, function(err, result, res) {
      if (err) {
        return done(err);
      }
      assert(result.headers['content-type'].indexOf('multipart/form-data;') === 0);
      assert(res.status === 200);
      assert(result.files.uploadfile.filename === 'files.test.js');
      assert(result.files.uploadfile.mimetype === 'application/javascript');
      assert(result.files.foo.filename === 'files.test.js');
      assert(result.files.foo.mimetype === 'application/javascript');
      assert.deepEqual(result.form, {
        hello: 'hello world',
        foo: 'bar',
      });
      done();
    });
  });
});
