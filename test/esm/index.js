import { strict as assert } from 'assert';
import * as urllibStar from 'urllib';
import urllib from 'urllib';
import { request, HttpClient, USER_AGENT, getDefaultHttpClient } from 'urllib';

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
