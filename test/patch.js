/*!
 * urllib - test/patch.js
 *
 * patch for test on node 0.6.x
 * 
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
fs.existsSync = fs.existsSync || path.existsSync;