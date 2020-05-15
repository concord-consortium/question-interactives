'use strict';

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const devMode = argv.mode !== 'production';

  return {
    context: __dirname, // to automatically find tsconfig.json
    devtool: 'source-map',
    entry: {
      'multiple-choice': './src/multiple-choice/index.tsx',
      'open-response': './src/open-response/index.tsx',
      'fill-in-the-blank': './src/fill-in-the-blank/index.tsx',
      'wrapper': './src/shared/wrapper.tsx'
    },
    mode: 'development',
    output: {
      filename: '[name]/assets/index.[hash].js'
    },
    performance: { hints: false },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          enforce: 'pre',
          use: [
            {
              loader: 'tslint-loader',
              options: {}
            }
          ]
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader'
        },
        {
          test: /\.css$/i,
          use: [
            devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        {
          test: /\.(sa|sc)ss$/i,
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
          test: /\.(png|woff|woff2|eot|ttf|svg)$/,
          loader: 'url-loader',
          options: {
            limit: 8192,
            publicPath: '../../'
          }
        }
      ]
    },
    resolve: {
      extensions: [ '.ts', '.tsx', '.js' ]
    },
    stats: {
      // suppress "export not found" warnings about re-exported types
      warningsFilter: /export .* was not found in/
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: devMode ? "[name]/assets/index.css" : "[name]/assets/index.[hash].css"
      }),
      // HtmlWebpackPlugin and CopyWebpackPlugin will need to be configured in a similar way for all future question types.
      new HtmlWebpackPlugin({
        chunks: ['multiple-choice'],
        filename: 'multiple-choice/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['open-response'],
        filename: 'open-response/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['fill-in-the-blank'],
        filename: 'fill-in-the-blank/index.html',
        template: 'src/shared/index.html'
      }),
      // Wrapper page, useful for testing and Cypress.
      new HtmlWebpackPlugin({
        chunks: ['wrapper'],
        filename: 'wrapper.html',
        template: 'src/shared/wrapper.html'
      })
    ]
  };
};
