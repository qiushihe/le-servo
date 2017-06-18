var path = require("path");
var glob = require("glob");

module.exports = {
  entry: {
    server: ["./src"]
  },
  resolve: {
    extensions: [".js"],
    modules: [
      path.resolve(__dirname),
      "node_modules"
    ]
  },
  module: {
    loaders: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      loaders: "babel-loader"
    }]
  },
  output: {
    path: path.resolve(__dirname, "lib"),
    filename: "[name].js",
    chunkFilename: "[id].js"
  },
  target: "node"
};
