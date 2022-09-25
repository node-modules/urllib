import { describe, it } from 'vitest';
import { strict as assert } from 'assert';
import { globalId } from '../src/utils';

describe('utils.test.ts', () => {
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
