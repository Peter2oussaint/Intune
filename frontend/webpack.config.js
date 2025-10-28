// webpack.config.js
const path = require("path");
const webpack = require("webpack");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.join(__dirname, "/dist"),
    filename: "bundle.js",
  },
  plugins: [
    new Dotenv(),
    new HTMLWebpackPlugin({ template: "./public/index.html" }),
    new webpack.DefinePlugin({
      "process.env.INTUNE_API_URL": JSON.stringify(process.env.INTUNE_API_URL),
      "process.env.INTUNE_SUPABASE_URL": JSON.stringify(
        process.env.INTUNE_SUPABASE_URL
      ),
      "process.env.INTUNE_SUPABASE_ANON_KEY": JSON.stringify(
        process.env.INTUNE_SUPABASE_ANON_KEY
      ),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
      { test: /\.png$/, use: "file-loader" },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    proxy: [
      {
        context: ["/api"], // which requests to proxy
        target: "http://localhost:4000",
        secure: false, // if your backend is HTTPS with self-signed certs
        changeOrigin: true, // rewrite the Host header to the target URL
        // pathRewrite: { "^/api": "" }  // if your backend routes don’t include the /api prefix
      },
    ],
  },
};
