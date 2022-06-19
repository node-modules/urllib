/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

import os from 'os';

export default () => {
  // only report to GitHub annotations at 18.x
  const reporters = [ 'default', 'jest-summary-reporter' ];
  if (process.env.CI && os.platform() === 'linux' && process.version.startsWith('v18.')) {
    reporters.push('github-actions');
  }

  return {
    preset: 'ts-jest',
    testEnvironment: 'node',
    reporters,
    testRegex: '(/test/.*\\.(test|spec))\\.(ts)$',
    testTimeout: 60000,
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
    ],
  };
}
