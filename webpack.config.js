const autoprefixer = require('autoprefixer')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const path = require('path')

const sassLoaders = [
  'css-loader',
  'postcss-loader'
]

const config = {
  entry: './src/index.js',
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        presets: path.join(__dirname, '/.babelrc').presets,
        query: path.parse(require.main.filename).name !== 'browsersync-server' ? {} : { // HACK: enabled only in `npm start`
          "plugins": [
            ["react-transform", {
              "transforms": [{
                "transform": "react-transform-hmr",
                "imports": ["react"],
                "locals": ["module"]
              }]
            }]
          ]
        }
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style-loader', "css-loader")
      }
    ]
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'static'),
    publicPath: '/'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.NoErrorsPlugin(),
    new ExtractTextPlugin('[name].css')
  ],
  postcss: [
    autoprefixer({
      browsers: ['last 2 versions']
    })
  ],
  resolve: {
    extensions: ['', '.js', '.css', '.jsx'],
    Directories: ['src', 'node_modules']
  }
}

module.exports = config
