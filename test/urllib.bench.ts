import { bench, describe } from 'vite-plus/test';

import { HttpClient } from '../src/index.js';
import { parseJSON, digestAuthHeader, globalId, performanceTime } from '../src/utils.js';

describe('HttpClient Benchmarks', () => {
  bench('create HttpClient instance', () => {
    new HttpClient();
  });

  bench('create HttpClient with defaultArgs', () => {
    new HttpClient({
      defaultArgs: {
        timeout: 30000,
        headers: {
          'x-custom-header': 'benchmark',
        },
      },
    });
  });

  bench('create HttpClient with connect options', () => {
    new HttpClient({
      connect: {
        timeout: 10000,
        rejectUnauthorized: true,
      },
    });
  });
});

describe('Utility Functions Benchmarks', () => {
  const jsonString = JSON.stringify({ foo: 'bar', count: 123, nested: { a: 1, b: 2 } });
  const largeJsonString = JSON.stringify({
    items: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` })),
  });

  bench('parseJSON - small object', () => {
    parseJSON(jsonString);
  });

  bench('parseJSON - large array', () => {
    parseJSON(largeJsonString);
  });

  bench('parseJSON with fixJSONCtlChars', () => {
    parseJSON(jsonString, true);
  });

  const wwwAuthenticate =
    'Digest realm="testrealm@host.com", qop="auth,auth-int", nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", opaque="5ccc069c403ebaf9f0171e9517f40e41"';

  bench('digestAuthHeader', () => {
    digestAuthHeader('GET', '/api/resource', wwwAuthenticate, 'user:password');
  });

  bench('globalId', () => {
    globalId('benchmark');
  });

  bench('performanceTime', () => {
    performanceTime(performance.now() - 100);
  });
});
