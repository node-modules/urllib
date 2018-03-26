'use strict';

module.exports = process.env.CI ? {
  // npmjs.com do not support gzip now
  npmWeb: 'https://cnpmjs.org',
  npmRegistry: 'https://registry.npmjs.com',
  npmHttpRegistry: 'http://registry.npmjs.com',
} : {
  npmWeb: 'https://npm.taobao.org',
  npmRegistry: 'https://registry.npm.taobao.org',
  npmHttpRegistry: 'http://registry.npm.taobao.org',
};
