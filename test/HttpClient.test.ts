import { strict as assert } from 'assert';
import { HttpClient } from '../src/HttpClient';

describe('HttpClient.test.ts', () => {
  describe('clientOptions.defaultArgs', () => {
    it('should work with custom defaultArgs', async () => {
      const httpclient = new HttpClient({ defaultArgs: { timeout: 1000 } });
      assert(httpclient);
    });
  });
});
