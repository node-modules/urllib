import nkzw from '@nkzw/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [nkzw],
  // urllib is a Node.js HTTP client library — no React
  plugins: ['typescript', 'import', 'unicorn'],
  ignorePatterns: ['dist/**', 'test/fixtures/**', 'test/esm/**', 'test/cjs/**', 'test/mts/**'],
  rules: {
    // Allow console usage in a Node.js library
    'no-console': 'off',
    // Allow any in internal utility code
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow require() for CJS compat
    '@typescript-eslint/no-require-imports': 'off',

    // --- Disable React rules (not a React project) ---
    'react/display-name': 'off',
    'react/jsx-key': 'off',
    'react/jsx-no-comment-textnodes': 'off',
    'react/jsx-no-duplicate-props': 'off',
    'react/jsx-no-target-blank': 'off',
    'react/jsx-no-undef': 'off',
    'react/no-children-prop': 'off',
    'react/no-danger-with-children': 'off',
    'react/no-direct-mutation-state': 'off',
    'react/no-find-dom-node': 'off',
    'react/no-is-mounted': 'off',
    'react/no-render-return-value': 'off',
    'react/no-string-refs': 'off',
    'react/no-unescaped-entities': 'off',
    'react/no-unknown-property': 'off',
    'react/require-render-return': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react-hooks-js/component-hook-factories': 'off',
    'react-hooks-js/config': 'off',
    'react-hooks-js/error-boundaries': 'off',
    'react-hooks-js/gating': 'off',
    'react-hooks-js/globals': 'off',
    'react-hooks-js/immutability': 'off',
    'react-hooks-js/incompatible-library': 'off',
    'react-hooks-js/preserve-manual-memoization': 'off',
    'react-hooks-js/purity': 'off',
    'react-hooks-js/refs': 'off',
    'react-hooks-js/set-state-in-effect': 'off',
    'react-hooks-js/set-state-in-render': 'off',
    'react-hooks-js/static-components': 'off',
    'react-hooks-js/unsupported-syntax': 'off',
    'react-hooks-js/use-memo': 'off',
    '@nkzw/ensure-relay-types': 'off',
    '@nkzw/require-use-effect-arguments': 'off',

    // --- Too invasive for an existing codebase ---
    // Object/interface sorting would touch every file
    'perfectionist/sort-objects': 'off',
    'perfectionist/sort-object-types': 'off',
    'perfectionist/sort-interfaces': 'off',
    'perfectionist/sort-enums': 'off',
    'perfectionist/sort-heritage-clauses': 'off',
    'perfectionist/sort-jsx-props': 'off',

    // Allow instanceof — common pattern in Node.js error handling
    '@nkzw/no-instanceof': 'off',

    // Library code legitimately uses no-undef globals (Buffer, etc.)
    'no-undef': 'off',

    // Allow top-level await flexibility
    'unicorn/prefer-top-level-await': 'off',
  },
});
