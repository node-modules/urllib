/* eslint-disable @typescript-eslint/no-var-requires */
const { strict: assert } = require('assert');
const urllib = require('urllib');
const { request, HttpClient, USER_AGENT } = require('urllib');

console.log(urllib);
console.log(urllib.USER_AGENT, USER_AGENT);
console.log(urllib.request, urllib.HttpClient);
console.log(request, HttpClient);

assert(urllib);
assert(USER_AGENT);
assert.equal(urllib.USER_AGENT, USER_AGENT);
assert.equal(typeof urllib.request, 'function');
assert.equal(urllib.request, request);
assert.equal(urllib.HttpClient, HttpClient);
