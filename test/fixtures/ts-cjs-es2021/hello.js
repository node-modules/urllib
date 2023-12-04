"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const urllib_1 = require("urllib");
const urllib2 = require("urllib");
async function request(url, options) {
    return await urllib_1.default.request(url, options);
}
async function request2(url, options) {
    return await urllib2.curl(url, options);
}
console.log(request, request2);
