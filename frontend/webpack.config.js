const path = require("path");
const webpack = require("webpack");
const HTMLWebpackPlugin = require("html-webpack-plugin");

// Load .env file in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/index.js",

    output: {
      path: path.join(__dirname, "/dist"),
      filename: "bundle.js",
      publicPath: "/",
    },

    plugins: [
      new HTMLWebpackPlugin({
        template: "./public/index.html",
      }),

      new webpack.DefinePlugin({
        "process.env.INTUNE_API_URL": JSON.stringify(
          process.env.INTUNE_API_URL || "http://localhost:4000"
        ),
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
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          type: "asset/resource",
        },
      ],
    },

    resolve: {
      extensions: [".js", ".jsx"],
    },

    devServer: {
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: true,
      proxy: [
        {
          context: ["/api"],
          target: "http://localhost:4000",
          secure: false,
          changeOrigin: true,
        },
      ],
    },
  };
};
