'use strict';

// Jest config lives in a .js file (not package.json) so the lara-interactive-api
// moduleNameMapper can use require.resolve. Until the non-prerelease 1.14.0 ships,
// dynamic-text's `>=1.8.0` peer keeps a second 1.13.0 copy in the tree, and a
// hardcoded `<rootDir>node_modules/...` path is layout-dependent (it isn't present
// in every install/OS hoist). require.resolve always points at the real installed
// copy, forcing every lara import onto a single module so the library's
// "loaded multiple times" guard doesn't fire. Mirrors the webpack resolve.alias.
module.exports = {
  testURL: 'https://question-interactives.unexisting.url.com',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    'node_modules/(@smithy|@aws-sdk)/.+\\.js$': '../../jest-node-protocol-transform.js'
  },
  transformIgnorePatterns: ['node_modules/(?!(@smithy|@aws-sdk)/)'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  testPathIgnorePatterns: ['/node_modules/', '/cypress/'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^@concord-consortium/lara-interactive-api$': require.resolve('@concord-consortium/lara-interactive-api')
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
