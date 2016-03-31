module.exports = {
    entry: './ts-built/JsonApiAdapter.js',
  output: {
    filename: './dist/js-data-jsonapi.js',
    libraryTarget: 'umd',
    library: 'DSJsonApiAdapter'
  },
  externals: {
    'js-data': {
      amd: 'js-data',
      commonjs: 'js-data',
      commonjs2: 'js-data',
      root: 'JSData'
    },
    'js-data-http': {
        amd: 'js-data-http',
        commonjs: 'js-data-http',
        commonjs2: 'js-data-http',
        root: 'DSHttpAdapter'
    }
  },
  module: {
    loaders: [
            {
                test: /(src)(.+)\.js$/, 
                exclude: /node_modules/, 
                loader: 'babel-loader?blacklist=useStrict'
            }
    ]
  }
};