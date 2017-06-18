var webpack = require("webpack");
var nodeExternals = require("webpack-node-externals");
var path = require("path");
var glob = require("glob");

module.exports = {
  entry: {
    test: glob.sync("./test/**/*.js")
  },
  resolve: {
    extensions: [".js"],
    modules: [
      path.resolve(__dirname),
      "node_modules"
    ],
    alias: {
      "chai.provider": path.resolve(__dirname, "test/providers/chai.provider.js"),
      "sinon.provider": path.resolve(__dirname, "test/providers/sinon.provider.js")
    }
  },
  module: {
    loaders: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      loaders: "babel-loader"
    }]
  },
  plugins: [
    new webpack.ProvidePlugin({
      chai: ["chai.provider", "default"],
      expect: ["chai", "expect"],
      sinon: ["sinon.provider", "default"]
    })
  ],
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js",
    chunkFilename: "[id].js"
  },
  target: "node",
  externals: [nodeExternals()]
};
