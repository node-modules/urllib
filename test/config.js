'use strict';

module.exports = process.env.CI ? {
  npmWeb: 'https://cnpmjs.org',
  npmRegistry: 'https://registry.cnpmjs.org',
  npmHttpRegistry: 'http://registry.cnpmjs.org',
} : {
  npmWeb: 'https://npm.taobao.org',
  npmRegistry: 'https://registry.npm.taobao.org',
  npmHttpRegistry: 'http://registry.npm.taobao.org',
};
