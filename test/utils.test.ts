import { strict as assert } from 'node:assert';
import { Readable } from 'node:stream';

import { describe, it } from 'vite-plus/test';

import { globalId, isReadable } from '../src/utils.js';

describe('utils.test.ts', () => {
  describe('isReadable()', () => {
    it('should return a boolean for streams and non-stream values', () => {
      const stream = Readable.from(['hello']);
      assert.equal(isReadable(stream), true);
      stream.destroy();
      assert.equal(isReadable(stream), false);
      for (const value of [null, undefined, {}, 'hello', Buffer.from('hello')]) {
        assert.equal(isReadable(value), false);
      }
    });
  });

  describe('globalId()', () => {
    it('should auto increase', () => {
      assert(globalId('unittest') === 1);
      assert(globalId('unittest') === 2);
      assert(globalId('unittest') === 3);
      assert(globalId('unittest') === 4);
      assert(globalId('unittest') === 5);
      assert(globalId('unittest-other') === 1);
      assert(globalId('unittest') === 6);
      assert(globalId('unittest-other') === 2);
    });
  });
});
