'use strict';

var fs = require('fs');
var path = require('path');
var coffee = require('coffee');

describe('typescript.test.js', function() {
  if (parseInt(process.versions.node) < 4) {
    return;
  }

  var cwd = path.join(__dirname, 'typescript');

  before(function(done) {
    coffee.spawn('tsc', { cwd: cwd })
      .debug()
      .expect('code', 0)
      .end(done);
  });
  after(function() {
    fs.unlinkSync(path.join(cwd, 'index.js'));
  });

  it('run test', function(done) {
    coffee.spawn('mocha', [ 'index.js' ], { cwd: cwd })
      .debug()
      .expect('code', 0)
      .end(done);
  });
});
