import { describe, test } from 'vite-plus/test';

import { HttpClient } from '../src/index.js';
import { parseJSON, digestAuthHeader, globalId, performanceTime } from '../src/utils.js';

describe('HttpClient Benchmarks', () => {
  test('create HttpClient instance', async ({ bench }) => {
    await bench('create HttpClient instance', () => {
      new HttpClient();
    }).run();
  });

  test('create HttpClient with defaultArgs', async ({ bench }) => {
    await bench('create HttpClient with defaultArgs', () => {
      new HttpClient({
        defaultArgs: {
          timeout: 30000,
          headers: {
            'x-custom-header': 'benchmark',
          },
        },
      });
    }).run();
  });

  test('create HttpClient with connect options', async ({ bench }) => {
    await bench('create HttpClient with connect options', () => {
      new HttpClient({
        connect: {
          timeout: 10000,
          rejectUnauthorized: true,
        },
      });
    }).run();
  });
});

describe('Utility Functions Benchmarks', () => {
  const jsonString = JSON.stringify({ foo: 'bar', count: 123, nested: { a: 1, b: 2 } });
  const largeJsonString = JSON.stringify({
    items: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` })),
  });

  test('parseJSON - small object', async ({ bench }) => {
    await bench('parseJSON - small object', () => {
      parseJSON(jsonString);
    }).run();
  });

  test('parseJSON - large array', async ({ bench }) => {
    await bench('parseJSON - large array', () => {
      parseJSON(largeJsonString);
    }).run();
  });

  test('parseJSON with fixJSONCtlChars', async ({ bench }) => {
    await bench('parseJSON with fixJSONCtlChars', () => {
      parseJSON(jsonString, true);
    }).run();
  });

  const wwwAuthenticate =
    'Digest realm="testrealm@host.com", qop="auth,auth-int", nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093", opaque="5ccc069c403ebaf9f0171e9517f40e41"';

  test('digestAuthHeader', async ({ bench }) => {
    await bench('digestAuthHeader', () => {
      digestAuthHeader('GET', '/api/resource', wwwAuthenticate, 'user:password');
    }).run();
  });

  test('globalId', async ({ bench }) => {
    await bench('globalId', () => {
      globalId('benchmark');
    }).run();
  });

  test('performanceTime', async ({ bench }) => {
    await bench('performanceTime', () => {
      performanceTime(performance.now() - 100);
    }).run();
  });
});
