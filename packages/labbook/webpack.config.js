'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const webpackCommon = require('../../shared/webpack-common.config.js');

module.exports = (env, argv) => {
  const interactiveName = path.basename(__dirname); // e.g. "open-response"

  return webpackCommon(env, argv, __dirname, {
    // Add custom webpack configuration here
    entry: {
      [`${interactiveName}`]: './src/index.tsx',
      [`${interactiveName}/demo`]: './src/demo.tsx'
    },
    plugins: [
      new HtmlWebpackPlugin({
        chunks: [interactiveName],
        filename: `${interactiveName}/index.html`,
        template: '../../shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: [`${interactiveName}/demo`],
        filename: `${interactiveName}/demo.html`,
        template: '../../shared/index.html'
      }),
    ]
  });
};
