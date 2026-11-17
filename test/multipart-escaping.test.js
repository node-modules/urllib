'use strict';

var assert = require('assert');
var http = require('http');
var fs = require('fs');
var os = require('os');
var path = require('path');
var PassThrough = require('stream').PassThrough;
var urllib = require('..');

describe('test/multipart-escaping.test.js', function() {
  var server;
  var url;
  var filename = 'evil.txt"\r\nX-Injected: smuggled\r\nContent-Disposition: form-data; name="ghost';
  var escaped = 'evil.txt%22%0D%0AX-Injected: smuggled%0D%0AContent-Disposition: form-data; name=%22ghost';

  before(function(done) {
    server = http.createServer(function(req, res) {
      req.pipe(res);
    });
    server.listen(0, '127.0.0.1', function() {
      url = 'http://127.0.0.1:' + server.address().port;
      done();
    });
  });

  after(function(done) {
    server.close(done);
  });

  function check(options, expected, done) {
    options.dataType = 'text';
    options.headers = { connection: 'close' };
    urllib.request(url, options, function(err, body, res) {
      if (err) {
        return done(err);
      }
      try {
        assert.strictEqual(res.status, 200);
        assert(body.indexOf(expected) !== -1, JSON.stringify(body));
        assert.strictEqual(body.indexOf('\r\nX-Injected:'), -1);
        assert.strictEqual((body.match(/\r\nContent-Disposition:/g) || []).length, options.data ? 2 : 1);
        assert(body.indexOf('\r\n\r\ndata\r\n') !== -1);
        done();
      } catch (error) {
        done(error);
      }
    });
  }

  it('escapes filenames from stream paths', function(done) {
    var stream = new PassThrough();
    stream.path = filename;
    stream.end('data');
    check({ files: stream }, 'name="file"; filename="' + escaped + '"\r\n', done);
  });

  [ 'buffer', 'stream', 'file' ].forEach(function(source) {
    it('escapes file field names for ' + source, function(done) {
      var file = Buffer.from('data');
      if (source === 'stream') {
        file = new PassThrough();
        file.end('data');
      } else if (source === 'file') {
        file = path.join(os.tmpdir(), 'urllib-multipart-' + process.pid + '.txt');
        fs.writeFileSync(file, 'data');
      }
      var files = {};
      files[filename] = file;
      check({ files: files }, 'name="' + escaped + '"; filename="', function(err) {
        if (source === 'file') {
          fs.unlinkSync(file);
        }
        done(err);
      });
    });
  });

  it('escapes normal field names', function(done) {
    var data = {};
    data[filename] = 'value';
    check({ files: Buffer.from('data'), data: data }, 'name="' + escaped + '"\r\n', done);
  });

  it('escapes a filesystem filename without changing the path used to read it', function(done) {
    if (process.platform === 'win32') {
      return this.skip();
    }
    var directory = path.join(os.tmpdir(), 'urllib-multipart-path-' + process.pid);
    var file = path.join(directory, filename);
    fs.mkdirSync(directory);
    fs.writeFileSync(file, 'data');
    check({ files: file }, 'name="file"; filename="' + escaped + '"\r\n', function(err) {
      fs.unlinkSync(file);
      fs.rmdirSync(directory);
      done(err);
    });
  });

  [
    [ 'a"b".txt', 'a%22b%22.txt' ],
    [ 'a\rb\r.txt', 'a%0Db%0D.txt' ],
    [ 'a\nb\n.txt', 'a%0Ab%0A.txt' ],
    [ "中文 a';=%.txt", "中文 a';=%.txt" ],
  ].forEach(function(pair) {
    it('uses standard filename escaping for ' + JSON.stringify(pair[0]), function(done) {
      var stream = new PassThrough();
      stream.path = pair[0];
      stream.end('data');
      check({ files: stream }, 'filename="' + pair[1] + '"\r\n', done);
    });
  });
});
