'use strict';

module.exports = process.env.CI ? {
  npmWeb: 'https://cnpmjs.org',
  npmRegistry: 'https://r.cnpmjs.org',
  npmHttpRegistry: 'http://r.cnpmjs.org',
} : {
  npmWeb: 'https://npm.taobao.org',
  npmRegistry: 'https://registry.npm.taobao.org',
  npmHttpRegistry: 'http://registry.npm.taobao.org',
};
