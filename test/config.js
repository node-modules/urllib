'use strict';

module.exports = process.env.CI ? {
  npmWeb: 'https://www.npmjs.com',
  npmRegistry: 'https://registry.npmjs.com',
  npmHttpRegistry: 'http://registry.npmjs.com',
} : {
  npmWeb: 'https://www.npmjs.com',
  npmRegistry: 'https://registry.npmmirror.com',
  npmHttpRegistry: 'http://registry.npmmirror.com',
};
