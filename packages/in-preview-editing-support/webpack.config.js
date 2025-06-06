const path = require('path');

module.exports = {
  entry: {
    "coremedia.in-preview-editing-support": [
      './src/js/index.js',
    ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'CoreMediaInPreviewEditing',
      type: 'umd'
    },
    globalObject: 'this',
    clean: true,
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ]
  }
};
