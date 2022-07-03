describe('test/urllib.test.js', function () {
  describe('on()', function () {
    var urllib = require('../').create();
    afterEach(function () {
      urllib.removeAllListeners('response');
      urllib.removeAllListeners('request');
    });

    it('should listen response event', function (done) {
      done = pedding(4, done);
      urllib.on('response', function (info) {
        if (info.req.options.path === '/error') {
          assert(info.error);
          assert(info.res.status === -1);
          assert(info.req.size >= 0);
          assert.deepEqual(info.ctx, {
            foo: 'error request',
          });
        } else {
          assert(!info.error);
          assert(info.res.status === 200);
          assert(info.req.size === 7);
          assert(info.res.size === info.req.size);
          assert(info.req.options.path === '/stream');
          assert.deepEqual(info.ctx, {
            foo: 'stream request',
          });
          assert(info.req.socket.remoteAddress === '127.0.0.1');
          assert(info.req.socket.remotePort === port);
        }
        done();
      });

      urllib.request(host + '/error', {
        ctx: {
          foo: 'error request'
        }
      }, function (err) {
        assert(err);
        done();
      });

      urllib.request(host + '/stream', {
        method: 'post',
        data: {foo: 'bar'},
        ctx: {
          foo: 'stream request'
        }
      }, function (err) {
        assert(!err);
        done();
      });
    });

    it('should listen request url is string, when request url is object', function (done) {
      done = pedding(3, done);
      var requestUrl = 'https://cn.bing.com/search?q=nodejs';

      urllib.on('request', function (info) {
        assert(info.url === requestUrl);
        done();
      });

      urllib.on('response', function (info) {
        assert(info.req.url === requestUrl);
        assert(info.res.requestUrls[0] === requestUrl);
        done();
      });

      var urlObj = urlutil.parse(requestUrl);

      urllib.request(urlObj, function (err) {
        assert(!err);
        done();
      });
    });

    it('should trigger req/res in pair when followRedirect', function (done) {
      done = pedding(5, done);
      var redirected = false;
      urllib.on('request', function (info) {
        info.args.headers = info.args.headers || {};
        info.args.headers['custom-header'] = 'custom-header';
        done();
      });
      urllib.on('response', function (info) {
        if (info.req.options.path === '/302-to-200') {
          assert(info.res.status === 302);
          assert(info.res.statusCode === 302);
          redirected = true;
        }
        assert(info.req.options.headers['custom-header'] === 'custom-header');
        assert(redirected);
        done();
      });

      urllib.request(host + '/302-to-200', {
        followRedirect: true,
        ctx: {
          foo: 'error request'
        }
      }, function () {
        done();
      });
    });
  });

  describe('args.dataAsQueryString = true', function() {
    it('should delete params go in query string', function(done) {
      urllib.request(host + '/delete-params', {
        method: 'delete',
        data: {
          foo: 'bar',
        },
        dataType: 'json',
        dataAsQueryString: true,
      }, function(err, data) {
        assert(!err);
        assert(data.url === '/delete-params?foo=bar');
        done();
      });
    });
  });
});
