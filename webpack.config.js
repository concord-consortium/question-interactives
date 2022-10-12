'use strict';

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const GenerateJsonFromJsPlugin = require('generate-json-from-js-webpack-plugin');
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
      'carousel': './src/carousel/index.tsx',
      'convert-old-lara': './src/convert-old-lara/convert.ts',
      'multiple-choice': './src/multiple-choice/index.tsx',
      'multiple-choice-alerts': './src/multiple-choice-alerts/index.tsx',
      'open-response': './src/open-response/index.tsx',
      'open-response/report-item': './src/open-response/report-item-index.tsx',
      'fill-in-the-blank': './src/fill-in-the-blank/index.tsx',
      'scaffolded-question': './src/scaffolded-question/index.tsx',
      'video-player': './src/video-player/index.tsx',
      'image': './src/image/index.tsx',
      'drawing-tool': './src/drawing-tool/index.tsx',
      'image-question': './src/image-question/index.tsx',
      'graph': './src/graph/index.tsx',
      'drag-and-drop': './src/drag-and-drop/index.tsx',
      'full-screen': './src/full-screen/index.tsx',
      'labbook': './src/labbook/index.tsx',
      'side-by-side': './src/side-by-side/index.tsx',
      'score-bot': './src/score-bot/index.tsx',
      'score-bot/report-item': './src/score-bot/report-item-index.tsx',
      'wrapper': './src/shared/wrapper.tsx',
      'bar-graph': './src/bar-graph/index.tsx',
      'bar-graph/report-item': './src/bar-graph/report-item-index.tsx'
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
      alias: {
        // prevent duplicate react versions when npm linking lara-interactive-api
        // cf. https://github.com/facebook/react/issues/13991#issuecomment-435587809
        react: path.resolve(__dirname, './node_modules/react'),
      },
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
        chunks: ['carousel'],
        filename: 'carousel/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['convert-old-lara'],
        filename: 'convert-old-lara/index.html',
        template: 'src/convert-old-lara/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['multiple-choice'],
        filename: 'multiple-choice/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['multiple-choice-alerts'],
        filename: 'multiple-choice-alerts/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['open-response'],
        filename: 'open-response/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['open-response/report-item'],
        filename: 'open-response/report-item/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['fill-in-the-blank'],
        filename: 'fill-in-the-blank/index.html',
          template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['video-player'],
        filename: 'video-player/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['image'],
        filename: 'image/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['drawing-tool'],
        filename: 'drawing-tool/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['image-question'],
        filename: 'image-question/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['scaffolded-question'],
        filename: 'scaffolded-question/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['graph'],
        filename: 'graph/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['drag-and-drop'],
        filename: 'drag-and-drop/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['full-screen'],
        filename: 'full-screen/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['labbook'],
        filename: 'labbook/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['side-by-side'],
        filename: 'side-by-side/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['score-bot'],
        filename: 'score-bot/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['score-bot/report-item'],
        filename: 'score-bot/report-item/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['bar-graph'],
        filename: 'bar-graph/index.html',
        template: 'src/shared/index.html'
      }),
      new HtmlWebpackPlugin({
        chunks: ['bar-graph/report-item'],
        filename: 'bar-graph/report-item/index.html',
        template: 'src/shared/index.html'
      }),
      // Wrapper page, useful for testing and Cypress.
      new HtmlWebpackPlugin({
        chunks: ['wrapper'],
        filename: 'wrapper.html',
        template: 'src/shared/wrapper.html'
      }),
      // generate version.json
      new GenerateJsonFromJsPlugin({
        path: './generate-version-json.js',
        filename: 'version.json'
      }),
      new ESLintPlugin({
        extensions: ['ts','tsx']
      })
    ]
  };
};
