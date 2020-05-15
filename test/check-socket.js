'use strict';

const assert = require('assert');
const Agent = require('agentkeepalive');
const urllib = require('..');
const server = require('./fixtures/server');

describe('test/check-socket.js', () => {
  let host = 'http://127.0.0.1:';
  before(done => {
    server.listen(0, () => {
      const port = server.address().port;
      host += port;
      done();
    });
  });

  after(done => {
    setTimeout(() => {
      server.close();
      done();
    }, 1000);
  });

  it('should get socket on res or req', async () => {
    const keepaliveAgent = new Agent({
      maxSockets: 1000,
      maxFreeSockets: 100,
      timeout: 1200000,
      freeSocketTimeout: 60000,
    });

    async function sendMessage(url, data, method = 'GET') {
      const res = await urllib.request(url, {
        method,
        data,
        nestedQuerystring: true,
        timeout: 60000,
        agent: keepaliveAgent,
        contentType: 'json',
      });

      console.log(res.data.toString());
    };

    await sendMessage(host);
  });
});
