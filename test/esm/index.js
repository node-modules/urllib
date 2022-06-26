import { strict as assert } from 'assert';
import * as urllibStar from 'urllib';
import urllib from 'urllib';
import { request, HttpClient } from 'urllib';

console.log(urllibStar);
console.log(urllibStar.request, urllibStar.HttpClient);
console.log(urllib.request, urllib.HttpClient);
console.log(request, HttpClient);

assert(urllibStar);
assert.equal(typeof urllibStar.request, 'function');
assert.equal(urllibStar.request, request);
assert.equal(urllibStar.request, urllib.request);
assert.equal(urllibStar.HttpClient, HttpClient);
assert.equal(urllib.HttpClient, undefined);
