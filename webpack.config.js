var path = require("path");

module.exports = {
  entry: {
    bundle: [
      "./src"
    ]
  },
  resolve: {
    extensions: [".js"],
    modules: [
      path.resolve(__dirname, "src"),
      "node_modules"
    ]
  },
  output: {
    path: path.resolve(__dirname, "lib"),
    filename: "[name].js",
    chunkFilename: "[id].js"
  },
  node: {
    __dirname: false
  }
};
