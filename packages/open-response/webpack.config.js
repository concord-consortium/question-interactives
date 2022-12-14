'use strict';

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const path = require('path');
const os = require('os');

module.exports = (env, argv) => {
  const devMode = argv.mode !== 'production';

  return {
    context: __dirname, // to automatically find tsconfig.json
    devServer: {
      static: 'dist',
      hot: true,
      https: {
        key: path.resolve(os.homedir(), '.localhost-ssl/localhost.key'),
        cert: path.resolve(os.homedir(), '.localhost-ssl/localhost.pem'),
      },
    },
    devtool: devMode ? 'eval-cheap-module-source-map' : 'source-map',
    entry: {
      'open-response': './src/index.tsx',
      'open-response/report-item': './src/report-item-index.tsx'
    },
    mode: 'development',
    output: {
      filename: '[name]/assets/index.[contenthash].js'
    },
    performance: { hints: false },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader'
        },
        // .css files are minimally processed because we have included
        // files from libraries like bootstrap and video-js.
        {
          test: /\.css$/i,
          use: [
            devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        // .global.scss files are processed as global CSS, i.e. not as CSS modules
        {
          test: /\.global.(sa|sc)ss$/i,
          use: [
            devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader'
          ]
        },
        // .scss files are processed as CSS modules. Some recommend a naming convention of
        // .module.scss for CSS modules, but that would require renaming a bunch of files.
        {
          test: /\.(sa|sc)ss$/i,
          exclude: /\.global.(sa|sc)ss$/i,
          use: [
            devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[name]--[local]--question-int'
                },
                sourceMap: true,
                importLoaders: 1
              }
            },
            'postcss-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.(png|woff|woff2|eot|ttf)$/,
          loader: 'url-loader',
          options: {
            limit: 8192,
            publicPath: '../../'
          }
        },
        {
          test: /\.svg$/,
          oneOf: [
            {
              // Do not apply SVGR import in (S)CSS files or Javascript files (for the drawing tool).
              issuer: /\.((sa|sc|c)ss|js)$/,
              use: 'url-loader'
            },
            {
              issuer: /\.tsx?$/,
              loader: '@svgr/webpack'
            }
          ]
        }
      ]
    },
    resolve: {
      // alias: {
      //   // prevent duplicate react versions when npm linking lara-interactive-api
      //   // cf. https://github.com/facebook/react/issues/13991#issuecomment-435587809
      //   react: path.resolve(__dirname, './node_modules/react'),
      // },
      extensions: [ '.ts', '.tsx', '.js' ]
    },
    stats: {
      // suppress "export not found" warnings about re-exported types
      warningsFilter: /export .* was not found in/
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: devMode ? '[name]/assets/index.css' : '[name]/assets/index.[hash].css'
      }),
      // HtmlWebpackPlugin and CopyWebpackPlugin will need to be configured in a similar way for all future question types.
      new HtmlWebpackPlugin({
        chunks: ['open-response'],
        filename: 'open-response/index.html',
        template: '../../packages/helpers/src/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['open-response/report-item'],
        filename: 'open-response/report-item/index.html',
        template: '../../packages/helpers/src/index.html'
      }),
      new ESLintPlugin({
        extensions: ['ts','tsx']
      })
    ]
  };
};
