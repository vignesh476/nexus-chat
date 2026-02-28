const { override, addWebpackPlugin, addWebpackResolve } = require('customize-cra');
const webpack = require('webpack');
const path = require('path');

module.exports = override(
  addWebpackPlugin(
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    })
  ),
  addWebpackResolve({
    alias: {
      'process/browser': path.resolve(__dirname, 'node_modules/process/browser.js'),
    },
    fallback: {
      process: require.resolve('process/browser.js'),
      buffer: require.resolve('buffer'),
    },
  })
);
