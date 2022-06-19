describe('test/urllib.test.js', function () {
  describe('request()', function () {
    it('should request(host-only) work', function(done) {
      urllib.request('127.0.0.1:' + port, function(err, data, res) {
        assert(!err);
        assert(data instanceof Buffer);
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should request(undefined) thrown', function() {
      assert.throws(function () {
        urllib.requestWithCallback(undefined, function() {});
      }, /expect request url to be a string or a http request options, but got undefined/);
    });

    it('should request(1) thrown', function() {
      assert.throws(function () {
        urllib.requestWithCallback(1, function() {});
      }, /expect request url to be a string or a http request options, but got 1/);
    });

    it('should request(localhost:port) work', function(done) {
      urllib.requestWithCallback('localhost:' + port, function(err, data, res) {
        assert(!err);
        assert(data instanceof Buffer);
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should request https with port success', function (done) {
      urllib.request(config.npmRegistry + ':443/pedding/latest', {
        timeout: 25000,
      },
      function (err, data, res) {
        assert(!err);
        assert(Buffer.isBuffer(data));
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should request https disable httpsAgent work', function (done) {
      done = pedding(2, done);
      urllib.request(config.npmRegistry + '/pedding/latest', {
        httpsAgent: false,
        timeout: 25000,
      },
      function (err, data, res) {
        assert(!err);
        assert(Buffer.isBuffer(data));
        assert(res.statusCode === 200);
        done();
      });

      urllib.request(config.npmRegistry + '/pedding/latest', {
        agent: false,
        timeout: 25000,
      },
      function (err, data, res) {
        assert(!err);
        assert(Buffer.isBuffer(data));
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should include res.data', function (done) {
      urllib.request(config.npmRegistry + '/pedding/latest', {timeout: 25000},
      function (err, data, res) {
        assert(!err);
        assert(Buffer.isBuffer(data));
        assert(res.statusCode === 200);
        assert(data === res.data);
        done();
      });
    });

    it('should alias curl() work', function (done) {
      urllib.curl(config.npmRegistry + '/pedding/1.0.0', {timeout: 25000},
      function (err, data, res) {
        assert(!err);
        assert(Buffer.isBuffer(data));
        console.log(res.headers);
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should redirect to a full url and clean up the Host header', function (done) {
      var hostname = urlutil.parse(config.npmRegistry).hostname;
      urllib.request(config.npmRegistry + '/pedding/-/pedding-1.0.0.tgz', {
        followRedirect: true,
        timeout: 30000,
        headers: {
          Host: hostname,
        }
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        // size should be 2107
        assert(res.size === 2107);
        done();
      });
    });

    it('should omit any header that is explicitly set to null', function (done) {
      urllib.request(host + '/headers', {
        headers: {
          DNT: null
        },
        dataType: 'json'
      }, function(err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(!data.dnt);
        assert(!data.DNT);
        done();
      });
    });

    it('should omit accept-encoding header that is explicitly set to null even if option gzip is set to true', function (done) {
      urllib.request(host + '/headers', {
        headers: {
          'Accept-Encoding': null
        },
        gzip: true,
        dataType: 'json'
      }, function(err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(!data['accept-encoding']);
        assert(!data['Accept-Encoding']);
        done();
      });
    });

    if (process.platform !== 'win32') {
      it('should redirect with writeStream and make sure res resume', function (done) {
        coffee.fork(path.join(__dirname, 'redirect.js'))
        .expect('stdout', '404')
        .expect('code', 0)
        .end(done);
      });
    }

    it('should FollowRedirectError', function (done) {
      urllib.request(host + '/redirect_no_location', {followRedirect: true}, function (err, data) {
        assert(err);
        assert(err.name === 'FollowRedirectError');
        assert(err.message.indexOf('Got statusCode 302 but cannot resolve next location from headers, GET http://127.0.0.1:') >= 0);
        assert(data.toString() === 'I am 302 body');
        done();
      });
    });

    it('should MaxRedirectError', function (done) {
      urllib.request(host + '/loop_redirect', {followRedirect: true}, function (err, data) {
        assert(err);
        assert(err.name === 'MaxRedirectError');
        assert(err.message.indexOf('Exceeded maxRedirects. Probably stuck in a redirect loop ') >= 0);
        assert(data.toString() === 'Redirect to /loop_redirect');
        done();
      });
    });

    it('should normalize url', function (done) {
      urllib.request(config.npmRegistry + '/pedding/./1.0.0', function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        done(err);
      });
    });

    describe('ConnectionTimeoutError and ResponseTimeoutError', function () {
      it('should connection timeout', function (done) {
        urllib.request('http://npm.taobao.org', { timeout: 1 }, function (err, data, res) {
          assert(err);
          assert(err.name === 'ConnectionTimeoutError');
          assert(err.message.match(/^Connect timeout for 1ms\, GET http/));
          assert(typeof err.requestId === 'number');
          assert(err.status === -2);
          assert(!data);
          assert(res);
          assert(res.status === -2);
          done();
        });
      });

      it('should response timeout', function (done) {
        urllib.request(host + '/response_timeout', { timeout: 450 }, function (err, data, res) {
          assert(err);
          assert(err.name === 'ResponseTimeoutError');
          assert(err.message.match(/^Response timeout for 450ms\, GET http/));
          assert(typeof err.requestId === 'number');
          assert(data);
          assert(data.toString() === 'foo');
          assert(res);
          assert(res.statusCode === 200);
          done();
        });
      });

      it('can pass two timeout separately and get connect error', function (done) {
        urllib.request('http://npm.taobao.net', { timeout: [1, 10000] }, function (err, data, res) {
          assert(err);
          assert(err.name === 'ConnectionTimeoutError');
          assert(err.message.match(/^Connect timeout for 1ms\, GET http/));
          assert(typeof err.requestId === 'number');
          assert(!data);
          assert(res);
          done();
        });
      });

      it('can pass two timeout separately and get response error', function(done) {
        urllib.request(host + '/response_timeout', { timeout: [1000, 450] }, function (err, data, res) {
          assert(err);
          assert(err.name === 'ResponseTimeoutError');
          assert(err.message.match(/^Response timeout for 450ms\, GET http/));
          assert(typeof err.requestId === 'number');
          assert(data);
          assert(data.toString() === 'foo');
          assert(res);
          assert(res.statusCode === 200);
          done();
        });
      });
    });

    it('should socket hang up by res.socket.destroy() before `response` event emit', function (done) {
      urllib.request(host + '/error', function (err, data, res) {
        assert(err);
        assert(err.name === 'ResponseError');
        assert(err.stack.indexOf('socket hang up') >= 0);
        assert(err.code === 'ECONNRESET');
        assert(!data);
        assert(res);
        done();
      });
    });

    it('should socket hang up by req.abort() before `response` event emit', function (done) {
      var req = urllib.request(host + '/timeout', {timeout: 500}, function (err, data, res) {
        assert(err);
        assert(err.stack.indexOf('socket hang up') >= 0);
        assert(err.code === 'ECONNRESET');
        assert(!data);
        assert(res);
        done();
      });
      setTimeout(function () {
        req.abort();
      }, 1);
    });

    it('should handle server socket end("balabal") will error', function (done) {
      urllib.request(host + '/socket.end.error', function (err, data) {
        assert(err);
        err.code && assert(err.code === 'ECONNRESET');
        assert(data);
        done();
      });
    });

    it('should get data with args.beforeRequest(options) to change query string', function (done) {
      var params = {
        data: {
          sql: 'SELECT * from table',
          data: '呵呵',
        },
        beforeRequest: function (options) {
          options.path += '&foo=bar';
        }
      };
      var options = {
        path: '/get',
        port: port,
      };
      urllib.request(options, params, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        var info = urlutil.parse(data.toString(), true);
        assert(info.pathname === '/get');
        assert(info.query.sql === params.data.sql);
        assert(info.query.data === params.data.data);
        assert(info.query.foo === 'bar');
        done();
      });
    });

    it('should support options.auth', function (done) {
      urllib.request(host + '/auth', {
        type: 'get',
        dataType: 'json',
        auth: 'fengmk2:pass',
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert.deepEqual(data, {user: 'fengmk2', password: 'pass'});
        done();
      });
    });

    it('should support http://user:pass@hostname', function (done) {
      urllib.request(host.replace('://', '://fengmk2:123456@') + '/auth', {
        type: 'get',
        dataType: 'json',
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert.deepEqual(data, {user: 'fengmk2', password: '123456'});
        done();
      });
    });

    it('should auto set accept headers when dataType = json and accept not exists', function(done) {
      urllib.request(host + '/headers/accept', {
        dataType: 'json',
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        assert(data.accept === 'application/json');
        done();
      });
    });

    it('should only set one content-length', function (done) {
      urllib.request(host + '/headers', {
        method: 'post',
        dataType: 'json',
        headers: {
          'content-length': '10',
        },
        data: {
          foo: 'bar11111111111111',
        },
        beforeRequest(options) {
          assert(options.headers['content-length'] === '21');
          assert(!options.headers['Content-Length']);
        }
      }, function (err, data, res) {
        assert(!err);
        assert(res.statusCode === 200);
        done();
      });
    });

    describe('mock sockets full', function () {
      var agent = new http.Agent({
        maxSockets: 1,
      });

      it('should case timeout after sockets link full', function (done) {
        done = pedding(2, done);

        var errCount = 0;
        urllib.request(host + '/timeout', {agent: agent, timeout: 1000}, function (err, data) {
          assert(!err);
          assert(errCount === 1);
          errCount = -1;
          assert(data.toString() === 'timeout 500ms');
          done();
        });

        // this will timeout first
        var req = urllib.request(host + '/timeout', {agent: agent, timeout: 300}, function (err) {
          assert(err);
          assert(err.noSocket);
          assert(err.name === 'SocketAssignTimeoutError');
          assert(errCount === 0);
          errCount++;
          done();
        });
        var reqs = agent.requests[Object.keys(agent.requests)[0]];
        assert(reqs.length === 1);
        assert(reqs[0].requestId === req.requestId);
      });
    });

    describe('support agentkeepalive', function () {
      before(function () {
        var KeepAliveAgent = require('agentkeepalive');
        this.agent = new KeepAliveAgent({
          keepAlive: true,
        });
        this.httpsAgent = new KeepAliveAgent.HttpsAgent({
          keepAlive: true
        });
      });

      var urls = [
        config.npmRegistry + '/byte',
        config.npmWeb,
        config.npmRegistry + '/pedding',

        config.npmWeb + '/package/byte',
        config.npmRegistry + '/pedding',
        config.npmWeb + '/package/pedding',
        config.npmRegistry + '/byte',
      ];

      urls.forEach(function (url, index) {
        it('should use KeepAlive agent request ' + url, function (done) {
          var agent = this.agent;
          var httpsAgent = this.httpsAgent;
          urllib.request(url, {
            agent: agent,
            httpsAgent: httpsAgent,
            timeout: 25000,
          }, function (err, data, res) {
            assert(!err);
            assert(data instanceof Buffer);
            if (res.statusCode !== 200) {
              console.log(res.statusCode, res.headers);
            }
            assert(res.headers.connection === 'keep-alive');
            if (index >= 3) {
              assert(res.keepAliveSocket === true);
            }
            done();
          });
        });
      });

      it('should keepAlive with same socket and count socketHandledRequests and socketHandledResponses', function(done) {
        var url = config.npmRegistry + '/pedding/latest';
        var KeepAliveAgent = require('agentkeepalive');
        var agent = new KeepAliveAgent({
          keepAlive: true,
        });
        var httpsAgent = new KeepAliveAgent.HttpsAgent({
          keepAlive: true,
        });
        var index = 0;
        function request() {
          index++;
          urllib.request(url, {
            agent: agent,
            httpsAgent: httpsAgent,
            timeout: 25000,
          }, function (err, data, res) {
            assert(!err);
            assert(data instanceof Buffer);
            if (res.statusCode !== 200) {
              console.log(res.statusCode, res.headers);
            }
            assert(res.headers.connection === 'keep-alive');
            if (index > 1) {
              assert(res.keepAliveSocket === true);
            }
            assert(res.socketHandledRequests === index);
            assert(res.socketHandledResponses === index);
            if (index === 5) {
              return done();
            }
            setTimeout(request, 10);
          });
        }
        request();
      });

      it('should request http timeout', function (done) {
        var agent = this.agent;
        var httpsAgent = this.httpsAgent;
        urllib.request(config.npmHttpRegistry + '/byte/2.0.0', {
          agent: agent,
          httpsAgent: httpsAgent,
          timeout: 25000,
          followRedirect: true,
        }, function (err, data, res) {
          assert(!err);
          assert(data instanceof Buffer);
          assert(res.statusCode === 200);
          // make sure free socket release to free list
          process.nextTick(function () {
            urllib.request(config.npmHttpRegistry + '/npm', {
              agent: agent,
              httpsAgent: httpsAgent,
              timeout: 1,
              followRedirect: true,
            }, function (err) {
              assert(err);
              assert(err.message.indexOf('(connected: true, keepalive socket: true, agent status: {"createSocketCount":') >= 0);
              assert(err.message.indexOf(', socketHandledRequests: ') >= 0);
              assert(err.message.indexOf(', socketHandledResponses: ') >= 0);
              done();
            });
          });
        });
      });

      it('should request https timeout', function (done) {
        var agent = this.agent;
        var httpsAgent = this.httpsAgent;
        urllib.request(config.npmRegistry + '/koa', {
          agent: agent,
          httpsAgent: httpsAgent,
          timeout: 25000,
        }, function (err, data, res) {
          assert(!err);
          assert(data instanceof Buffer);
          assert(res.statusCode === 200);
          assert(res.socketHandledRequests >= 1);
          assert(res.socketHandledResponses >= 1);
          var lastSocketHandledRequests = res.socketHandledRequests;
          var lastSocketHandledResponses = res.socketHandledResponses;
          // make sure free socket release to free list
          process.nextTick(function () {
            urllib.request(config.npmRegistry + '/npm', {
              agent: agent,
              httpsAgent: httpsAgent,
              timeout: 1,
            }, function (err) {
              assert(err);
              assert(err.res.socketHandledRequests === lastSocketHandledRequests + 1);
              // socketHandledResponses should not change
              assert(err.res.socketHandledResponses >= lastSocketHandledResponses);
              assert(err.message.indexOf('(connected: true, keepalive socket: true, agent status: {"createSocketCount":') >= 0);
              done();
            });
          });
        });
      });
    });

    it('should not emit request error if request is done', function (done) {
      var req = urllib.request(host + '/stream', {
        method: 'post',
        data: {foo: 'bar'},
        ctx: {
          foo: 'stream request'
        }
      }, function (err) {
        assert(!err);
        done();
      });

      req.on('response', () => {
        req.emit('error', new Error('mock error'));
      });
    });
  });

  describe('support stream', function () {
    it('should post stream success', function (done) {
      var stat = fs.statSync(__filename);
      var stream = fs.createReadStream(__filename);
      urllib.request(host + '/stream', {
        type: 'POST',
        stream: stream
      }, function (err, data, res) {
        assert(!err);
        assert(data instanceof Buffer);
        assert(data.length === stat.size);
        assert(res.headers['content-length'] === String(stat.size));
        done();
      });
    });

    it('should upload file with formstream', function (done) {
      var form = formstream();
      form.file('file', __filename);
      form.field('hello', '你好urllib');
      var args = {
        type: 'POST',
        headers: form.headers(),
        stream: form
      };
      urllib.request(host + '/stream', args, function (err, data, res) {
        assert(!err);
        data = data.toString();
        assert(data.indexOf('你好urllib\r\n----------------------------') >= 0);
        assert(data.indexOf('Content-Disposition: form-data; name="file"; filename="urllib.test.js"') >= 0);
        assert(res.statusCode === 200);
        done();
      });
    });

    it('should upload file with formstream and timeout', function (done) {
      var form = formstream();
      form.file('file', __filename);
      form.field('hello', '你好urllib');
      var args = {
        type: 'POST',
        headers: form.headers(),
        stream: form,
        timeout: 100,
      };
      urllib.request(host + '/stream-timeout', args, function (err) {
        assert(err.name === 'ResponseTimeoutError');
        done();
      });
    });

    it('should upload file with formstream and response streaming timeout', function (done) {
      var form = formstream();
      form.file('file', __filename);
      form.field('hello', '你好urllib');
      var args = {
        type: 'POST',
        headers: form.headers(),
        stream: form,
        streaming: true,
        timeout: 100,
      };
      urllib.request(host + '/stream-timeout', args, function (err) {
        assert(err.name === 'ResponseTimeoutError');
        done();
      });
    });

    it('should post not exists file stream', function (done) {
      var stream = fs.createReadStream(__filename + 'abc');
      urllib.request(host + '/stream', {
        type: 'POST',
        stream: stream
      }, function (err, data, res) {
        assert(err);
        assert(err.message.indexOf('ENOENT') >= 0);
        assert(err.res === res);
        assert(!data);
        assert(res);
        done();
      });
    });
  });

  describe('args.writeStream', function () {
    var tmpfile = path.join(process.env.TMPDIR || __dirname, 'urllib_writestream.tmp' + process.version);
    it('should store data writeStream with https', function (done) {
      done = pedding(2, done);
      var writeStream = fs.createWriteStream(tmpfile);
      writeStream.on('close', done);
      urllib.request(config.npmWeb, {
        writeStream: writeStream,
        timeout: 25000,
      }, function (err, data, res) {
        assert(!err);
        assert(fs.existsSync(tmpfile));
        assert(data === null);
        assert(res.statusCode === 200);
        assert(fs.statSync(tmpfile).size > 100);
        done();
      });
    });

    it('should timeout emit error', function (done) {
      var writeStream = fs.createWriteStream(tmpfile);
      urllib.request(host + '/bigfile', {
        writeStream: writeStream,
        timeout: 100,
      }, function (err, data, res) {
        assert(err, 'data is ' + (data && data.toString()));
        assert(err.name === 'ResponseTimeoutError');
        assert(!data);
        assert(res);
        done();
      });
    });

    it('should store data writeStream with followRedirect', function (done) {
      done = pedding(2, done);
      var writeStream = fs.createWriteStream(tmpfile);
      writeStream.on('close', function () {
        console.log('writeStream close event');
        done();
      });
      writeStream.on('finish', function () {
        console.log('writeStream finish event');
      });
      urllib.request(config.npmWeb + '/redir-tmp/', {
        writeStream: writeStream,
        followRedirect: true,
        timeout: 25000
      }, function (err, data) {
        assert(!err);
        assert(fs.existsSync(tmpfile));
        assert(data === null);
        assert(fs.statSync(tmpfile).size > 0);
        done();
      });
    });

    it('should return error when writeStream emit error', function (done) {
      var writeStream = fs.createWriteStream('/wrongpath/haha' + tmpfile);
      done = pedding(2, done);
      writeStream.on('error', function () {
        done();
      });
      urllib.request(host + '/writestream', {
        writeStream: writeStream
      }, function (err) {
        assert(err);
        assert(err.message.indexOf('ENOENT') >= 0);
        done();
      });
    });

    it('should end writeStream when server error', function (done) {
      var writeStream = fs.createWriteStream(tmpfile);
      urllib.request(host + '/error', {
        writeStream: writeStream
      }, function (err, data, res) {
        assert(err);
        assert(err.name === 'ResponseError');
        assert(err.stack.match(/socket hang up/));
        assert(err.code === 'ECONNRESET');
        assert(err.message.indexOf('/error -1 (connected: true, keepalive socket: false, socketHandledRequests: 1, socketHandledResponses: 0)\nheaders: {}') >= 0);
        assert(err.res === res);
        assert(!data);
        assert(res);
        assert.deepEqual(Object.keys(res), [
          'status', 'statusCode', 'statusMessage', 'headers', 'size',
          'aborted', 'rt', 'keepAliveSocket', 'data', 'requestUrls', 'timing',
          'remoteAddress', 'remotePort',
          'socketHandledRequests', 'socketHandledResponses',
        ]);
        done();
      });
    });

    it('should end when writeStream is not consumed', function(done) {
      var writeStream = through();
      urllib.request(host, {
        writeStream: writeStream,
        consumeWriteStream: false,
        timeout: 25000,
      }, function (err, data, res) {
        assert(!err);
        assert(data === null);
        assert(res.statusCode === 200);

        var content = '';
        writeStream
        .on('data', function(data) {
          content += data;
        })
        .on('end', function() {
          assert(content.length > 80);
          done();
        });
      });
    });
  });

  describe('args.streaming = true', function () {
    it('should got streaming the response', function (done) {
      urllib.request(config.npmWeb, {
        timeout: 25000,
        streaming: true
      }, function (err, data, res) {
        assert(!err);
        assert(!data);
        var size = 0;
        res.on('data', function (chunk) {
          size += chunk.length;
        });
        res.on('end', function () {
          assert(size > 0);
          done();
        });
      });
    });

    it('should work with alias name customResponse', function (done) {
      urllib.request(config.npmWeb, {
        timeout: 25000,
        customResponse: true
      }, function (err, data, res) {
        assert(!err);
        var size = 0;
        res.on('data', function (chunk) {
          size += chunk.length;
        });
        res.on('end', function () {
          assert(size > 0);
          done();
        });
      });
    });

    it('custom the response data should ok when req error: domain invalid', function (done) {
      urllib.request('https://no-exist/fengmk2/urllib', {
        timeout: 10000,
        customResponse: true
      }, function (err) {
        assert(err);
        console.log(err);
        // EAI_AGAIN on node >= 14
        assert(err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN');
        done();
      });
    });

    it('should follow redirect', function (done) {
      urllib.request(host + '/302-to-200', {
        streaming: true,
        followRedirect: true
      }, function (err, data, res) {
        assert(!err);
        assert(!data);
        assert(res.statusCode === 200);
        assert(!res.headers.location);
        var size = 0;
        res.on('data', function (chunk) {
          size += chunk.length;
        });
        res.on('end', function () {
          assert(size > 0);
          done();
        });
      });
    });

    it('should work with promise', function (done) {
      urllib.request(host + '/302-to-200', {
        timeout: 30000,
        streaming: true,
        followRedirect: true
      }).then(function (result) {
        assert(result.status === 200);
        assert(result.res instanceof Stream);
        var size = 0;
        result.res.on('data', function (chunk) {
          size += chunk.length;
        });
        result.res.on('end', function () {
          assert(size > 0);
          done();
        });
      }).catch(done);
    });

    it('should streaming with ungzip', function (done) {
      var url = config.npmRegistry + '/pedding/-/pedding-1.0.0.tgz';
      urllib.request(url, {
        streaming: true,
        followRedirect: true,
        timeout: 30000,
      }, function (err, _, res) {
        assert(!err);
        assert(res.statusCode === 200);

        var tmpdir = path.join(os.tmpdir(), 'pedding-ungzip2');
        mkdirp.sync(tmpdir);
        var gunzip = zlib.createGunzip();
        gunzip.on('error', done);
        var extracter = tar.x({ cwd: tmpdir });
        extracter.on('error', done);
        extracter.on('end', function () {
          console.log('version %s', require(path.join(tmpdir, 'package/package.json')).version);
          done();
        });
        res.pipe(gunzip).pipe(extracter);
      });
    });
  });

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
  
  // only test checkAddress in node 8+
  if (parseInt(process.version.slice(1)) >= 8) {
    describe('args.checkAddress', function() {
      it('should throw error when request address illegal', function(done) {
        urllib.request('http://10.10.10.10/foo/bar', {
          checkAddress: function(address) {
            return address !== '10.10.10.10';
          },
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should throw error when request address is ip v6', function(done) {
        urllib.request('http://[2001:0DB8:02de:0000:0000:0000:0000:0e13]/foo/bar', {
          checkAddress: function(address, family) {
            return family !== 6;
          },
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should throw error when follow redirect and redirect address illegal', function(done) {
        urllib.request(host + '/redirect_to_ip', {
          checkAddress: function(address) {
            return address !== '10.10.10.10';
          },
          followRedirect: true,
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should work with domain', function(done) {
        muk(dns, 'lookup', function (host, opts, callback) {
          callback(null, '10.10.10.10');
        });
        urllib.request('http://www.baidu.com/redirect_to_ip', {
          checkAddress: function(address) {
            return address !== '10.10.10.10';
          },
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should work with domain and redirect', function(done) {
        muk(dns, 'lookup', function (host, opts, callback) {
          callback(null, '10.10.10.10');
        });
        urllib.request(host + '/redirect_to_domain', {
          checkAddress: function(address) {
            return address !== '10.10.10.10';
          },
          followRedirect: true,
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should work with custom lookup', function(done) {
        urllib.request('http://www.baidu.com/redirect_to_domain', {
          checkAddress: function(address) {
            return address !== '10.10.10.10';
          },
          lookup: function(host, options, callback) {
            callback(null, '10.10.10.10');
          },
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should work with custom lookup and v6', function(done) {
        urllib.request('http://www.baidu.com/redirect_to_domain', {
          checkAddress: function(address, family) {
            return family !== 6;
          },
          lookup: function(host, options, callback) {
            callback(null, '10.10.10.10', 6);
          },
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });

      it('should work with domain and redirect', function(done) {
        urllib.request(host + '/redirect_to_domain', {
          checkAddress: function(address) {
            return address !== '10.10.10.10';
          },
          lookup: function(host, options, callback) {
            callback(null, '10.10.10.10');
          },
          followRedirect: true,
        }, function (err) {
          assert(err.name === 'IllegalAddressError');
          assert(err.message.includes('illegal address'));
          done();
        });
      });
    });
  }
});
