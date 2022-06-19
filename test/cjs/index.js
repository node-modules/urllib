/* eslint-disable @typescript-eslint/no-var-requires */
const assert = require('assert/strict');
const urllib = require('urllib');
const { request, HttpClient } = require('urllib');

console.log(urllib);
console.log(urllib.request, urllib.HttpClient);
console.log(request, HttpClient);

assert(urllib);
assert.equal(typeof urllib.request, 'function');
assert.equal(urllib.request, request);
assert.equal(urllib.HttpClient, HttpClient);
