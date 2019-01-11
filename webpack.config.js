const path = require('path');
const webpack = require('webpack');

module.exports = {
  cache: true,
  context: path.resolve(__dirname, './src'),
  devtool: 'source-map',
  entry: ['./index.js'],
  externals: {},
  mode: 'production',
  name: 'GitBot',
  node: {
    Buffer: true,
    console: true,
    global: true,
    nodeBuiltin: true,
    process: true,
    setImmediate: true,
    __filename: true,
    __dirname: true,
  },
  optimization: {
    nodeEnv: 'production',
    minimize: false,
  },
  output: {
    auxiliaryComment: '(c) 2019 devlato <github@devlato.com>',
    filename: 'index.bundle.js',
    path: path.resolve(__dirname, './build'),
  },
  parallelism: 4,
  plugins: [new webpack.EnvironmentPlugin(['NODE_ENV'])],
  profile: true,
  resolve: {
    extensions: ['.js', '.json'],
    modules: [path.resolve(__dirname, './node_modules')],
  },
  stats: {
    colors: true,
  },
  target: 'async-node',
};

