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
  npmWeb: 'https://cnpmjs.org',
  npmRegistry: 'https://registry.cnpmjs.org',
  npmHttpRegistry: 'http://registry.cnpmjs.org',
} : {
  npmWeb: 'https://npm.taobao.org',
  npmRegistry: 'https://registry.npm.taobao.org',
  npmHttpRegistry: 'http://registry.npm.taobao.org',
};
