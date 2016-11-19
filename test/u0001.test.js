'use strict';

var urllib = require('..');
var server = require('./fixtures/server');

describe('test/u0001.test.js', function() {
  var host = 'http://127.0.0.1:';
  var port = null;

  before(function(done) {
    server.listen(0, function() {
      port = server.address().port;
      host += port;
      done();
    });
  });

  after(function(done) {
    setTimeout(function() {
      server.close();
      done();
    }, 1000);
  });

  it('should work on \\\\u0001 invaild json format', function() {
    return urllib.request(host + '/u0001.json', {
      dataType: 'json',
      fixJSONCtlChars: true,
    }).then(function(result) {
      // console.log(result.data);
      // console.log(result.data.data.title.replace(/\u0001/g, ''));
      result.data.data.title.should.be.a.String();
      result.data.data.title.should.containEql('\u0001\u0001');
    });
  });
});
