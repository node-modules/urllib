/**
 * Copyright(c) node-modules and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

module.exports = process.env.CI ? {
  npmWeb: 'https://www.npmjs.com',
  npmRegistry: 'https://registry.npmjs.com',
  npmHttpRegistry: 'http://registry.npmjs.com',
} : {
  npmWeb: 'https://npm.taobao.org',
  npmRegistry: 'https://registry.npm.taobao.org',
  npmHttpRegistry: 'http://registry.npm.taobao.org',
};
