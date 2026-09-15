import { strict as assert } from 'node:assert';
import { once } from 'node:events';
import { createServer } from 'node:http';

import * as urllibStar from 'urllib';
import urllib from 'urllib';
import { request, HttpClient, USER_AGENT, getDefaultHttpClient } from 'urllib';
import pkg from 'urllib/package.json' with { type: 'json' };

console.log(urllibStar);
console.log(urllibStar.request, urllibStar.HttpClient);
console.log(urllibStar.request, urllibStar.HttpClient);
console.log(urllibStar.USER_AGENT, urllib.USER_AGENT, USER_AGENT);
console.log(request, HttpClient);
console.log('stats %o', getDefaultHttpClient().getDispatcherPoolStats());

assert(urllibStar);
assert.equal(typeof urllibStar.request, 'function');
assert.equal(urllibStar.request, request);
assert.equal(urllibStar.request, urllib.request);
assert.equal(urllibStar.HttpClient, HttpClient);
assert.equal(urllib.HttpClient, undefined);
assert.equal(urllibStar.USER_AGENT, USER_AGENT);
assert.equal(urllib.USER_AGENT, USER_AGENT);
assert.equal(
  USER_AGENT,
  `node-urllib/${pkg.version} Node.js/${process.version.substring(1)} (${process.platform}; ${process.arch})`,
);

const server = createServer((req, res) => {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ userAgent: req.headers['user-agent'] }));
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');

try {
  const response = await request(`http://127.0.0.1:${server.address().port}`, { dataType: 'json' });
  assert.equal(response.status, 200);
  assert.deepEqual(response.data, { userAgent: USER_AGENT });
} finally {
  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
}
