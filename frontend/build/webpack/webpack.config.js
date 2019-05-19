const path = require("path");
const fs = require("fs");

// general plugins...
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

// production plugins...
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
// const MinifyPlugin = require("babel-minify-webpack-plugin");
// const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
// const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const basePath = process.cwd();

const projectInfo = require(path.resolve(basePath, "./package.json"));
// console.log(projectInfo)

let i = 0;

module.exports = (env = {}) => {
  const NODE_ENV = process.env.NODE_ENV || "development";
  const prodMode = NODE_ENV === "production";
  const ifAnalyze = !!env.analyze;
  const devServerPort = env.devserverPort || 8895;
  const aliasObject = projectInfo.alias
    ? Object.keys(projectInfo.alias).reduce((prev, next) => {
        prev[next] = path.resolve(basePath, projectInfo.alias[next]);
        return prev;
      }, {})
    : {};
  const { home } = projectInfo;
  const publicPath = typeof home === "string" ? home : typeof home === "object" ? home[NODE_ENV] : "/";
  if (typeof home === "object" && (home.development === undefined || home.production === undefined)) {
    throw new Error(`必须指定package.json -> home的'development'和'production'值!`);
  }

  // babelrc customize
  const babelrc = require(path.resolve(__dirname, "./config/.babelrc.js"));
  const customBabelrc = projectInfo.babelrc;
  if (customBabelrc) {
    if (customBabelrc.presets && customBabelrc.presets.length) {
      babelrc.presets = [...customBabelrc.presets, ...babelrc.presets];
    }
    if (customBabelrc.plugins && customBabelrc.plugins.length) {
      customBabelrc.plugins.forEach(cPlugin => {
        const pluginIndexInBabelrc = babelrc.plugins.findIndex(
          bPlugin => (typeof bPlugin === "string" ? bPlugin === cPlugin : bPlugin[0] === cPlugin[0])
        );
        if (pluginIndexInBabelrc !== -1) {
          babelrc.plugins[pluginIndexInBabelrc] = cPlugin;
        }
      });
      // babelrc.plugins = [...customBabelrc.plugins, ...babelrc.plugins];
    }
  }
  // 指定output输出目录
  const output = env.output || "output";
  // 指定extra envs
  const extraEnvs = env.env ? JSON.parse(env.env) : [];
  return {
    // specify webpack runtime dir context(typically process.cwd())
    context: basePath,
    entry: {
      // vendor: [
      // Required to support async/await
      // "@babel/polyfill"
      // ],
      main: ["@babel/polyfill", "./src/index"]
    },
    output: {
      // config.output.path has to be absolute!
      path: path.resolve(basePath, `./${output}`),
      filename: `app${prodMode ? ".[contenthash:8]" : ""}.js`,
      chunkFilename: `[name]${prodMode ? ".[contenthash:8]" : ""}.chunk.js`,
      publicPath: publicPath
    },
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      alias: Object.assign(aliasObject, {
        "react-hot-loader": path.resolve(path.join(basePath, "./node_modules/react-hot-loader")),
        react: path.resolve(path.join(basePath, "./node_modules/react"))
      })
    },
    // always generate source-map
    devtool: prodMode ? "none" : "source-map",
    // for browsers
    target: "web",
    devServer: {
      // fallback to ./src
      contentBase: "./src",
      compress: false,
      port: devServerPort,
      headers: { "Access-Control-Allow-Origin": "*" },
      // to-do: proxy
      historyApiFallback: true,
      proxy: projectInfo.proxy || {},
      host: "0.0.0.0",
      disableHostCheck: true
    },
    mode: NODE_ENV,
    module: {
      rules: [
        // All output '.js' files will  re-processed by 'source-map-loader' and 'eslint-loader'.
        {
          enforce: "pre",
          test: /\.jsx?$/,
          use: [
            "source-map-loader",
            {
              loader: "eslint-loader",
              options: {
                emitWarning: true,
                failOnWarning: false,
                // emitError: true,
                failOnError: true,
                configFile: path.resolve(__dirname, "./config/.eslintrc"),
                useEslintrc: false
              }
            }
          ],
          exclude: /(node_modules|bower_components)/
        },
        // for NOT css modules
        {
          test: path => {
            // console.log(filename);
            const filename = path.split("/").slice(-1)[0];
            return filename.match(/\.(css)$/) && !filename.includes("module");
          },
          use: [
            {
              loader: prodMode ? MiniCssExtractPlugin.loader : "style-loader"
            },
            {
              loader: "css-loader"
            },
            {
              loader: "postcss-loader",
              options: {
                ident: "postcss",
                plugins: [
                  require("autoprefixer")({
                    add: prodMode,
                    // react doesn't support ie < 11 anyway, so why css?
                    // 和babelrc中保持一致
                    browsers: [">0.25%", "not dead", "not ie <= 11", "not op_mini all"]
                  })
                ]
              }
            }
          ]
        },
        // for NOT less modules
        {
          test: path => {
            // console.log(filename);
            const filename = path.split("/").slice(-1)[0];
            return filename.match(/\.(less)$/) && !filename.includes("module");
          },
          use: [
            {
              loader: prodMode ? MiniCssExtractPlugin.loader : "style-loader"
            },
            {
              loader: "css-loader"
            },
            {
              loader: "postcss-loader",
              options: {
                ident: "postcss",
                plugins: [
                  require("autoprefixer")({
                    add: prodMode,
                    // react doesn't support ie < 11 anyway, so why css?
                    // 和babelrc中保持一致
                    browsers: [">0.25%", "not dead", "not ie <= 11", "not op_mini all"]
                  })
                ]
              }
            },
            {
              loader: "less-loader",
              options: {
                // antd modify colors
                modifyVars: projectInfo.modifyVars || {},
                javascriptEnabled: true
              }
            }
          ]
        },
        // for css/less modules
        {
          test: /\.module\.(css|less)$/,
          use: [
            {
              loader: prodMode ? MiniCssExtractPlugin.loader : "style-loader"
            },
            {
              loader: "typings-for-css-modules-loader",
              options: {
                modules: true,
                // https://github.com/Jimdo/typings-for-css-modules-loader#namedexport-option
                namedExport: true,
                localIdentName: "[local]--[hash:base64:6]",
                camelCase: true
              }
            },
            // {
            //   loader: "css-loader",
            //   options: {
            //     modules: true
            //   }
            // },
            {
              loader: "postcss-loader",
              options: {
                ident: "postcss",
                plugins: [
                  require("autoprefixer")({
                    add: prodMode,
                    // react doesn't support ie < 11 anyway, so why css?
                    browsers: [">0.25%", "not dead", "not ie <= 11", "not op_mini all"]
                  })
                ]
              }
            },
            {
              loader: "less-loader",
              options: {
                javascriptEnabled: true
              }
            }
          ]
        },
        {
          test: /\.(sa|sc)ss$/,
          use: [
            {
              loader: prodMode ? MiniCssExtractPlugin.loader : "style-loader"
            },
            {
              loader: "css-loader"
            },
            {
              loader: "postcss-loader",
              options: {
                ident: "postcss",
                plugins: [
                  require("autoprefixer")({
                    add: prodMode,
                    // react doesn't support ie < 11 anyway, so why css?
                    browsers: [">0.25%", "not dead", "not ie <= 11", "not op_mini all"]
                  })
                ]
              }
            },
            {
              loader: "sass-loader"
            }
          ]
        },
        // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
        // {
        //   test: /\.tsx?$/,
        //   use: [
        //     {
        //       loader: "awesome-typescript-loader",
        //       options: {
        //         configFileName: path.resolve(
        //           __dirname,
        //           "./config/tsconfig.json"
        //         )
        //       }
        //     }
        //   ]
        // },
        // normal babel-loader
        {
          test: /\.(j|t)sx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: babelrc
          }
        },

        // {
        //   test: /\.(js|jsx)$/,
        //   exclude: prodMode
        //     ? /__invalidFolder/
        //     : /(node_modules|bower_components)/,
        //   loader: [
        //     {
        //       loader: "babel-loader",
        //       options: require(path.resolve(__dirname, "./config/.babelrc.js"))
        //     }
        //   ]
        // },
        {
          test: /\.(jpg|gif|woff|woff2|eot|ttf|png|svg|otf|webp)/,
          use: [
            {
              loader: "url-loader",
              options: {
                // or handled by webpack as normal pic/asset
                limit: 100000
              }
            }
          ]
        }
        // {
        //   test: /\.svg/,
        //   use: [
        //     {
        //       loader: "url-loader",
        //       options: {
        //         limit: 100000,
        //         minetype: "image/svg+xml"
        //       }
        //     }
        //   ]
        // }
      ]
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        tsconfig: path.resolve(basePath, "./tsconfig.json")
      }),
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: JSON.stringify(NODE_ENV),
          ...extraEnvs.reduce((prev, next) => ((prev[next] = JSON.stringify(next)), prev), {})
        }
      }),
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: path.resolve(basePath, "./index.ejs"),
        minify: {
          removeAttributeQuotes: prodMode,
          removeComments: prodMode,
          // minifyCSS: prodMode, // already minified
          minifyJS: prodMode
        },
        chunks: "all",
        // inlineSource: prodMode ? ".css$" : "",
        environment: NODE_ENV,
        chunksSortMode: "none",
        ...extraEnvs.reduce((prev, next) => ((prev[next] = String(next)), prev), {})
      })
    ].concat(
      prodMode
        ? [
            new CleanWebpackPlugin(path.resolve(basePath, `./${output}`), {
              allowExternal: true
            }),
            new MiniCssExtractPlugin({
              filename: prodMode ? "app.[hash:8].css" : "[name].css",
              chunkFilename: prodMode ? "[id].[hash:8].css" : "[id].css"
            }),
            // will conflict with something...
            // ------------------------------------
            // Long Term Caching
            // ------------------------------------
            // More information https://medium.com/webpack/predictable-long-term-caching-with-webpack-d3eee1d3fa31
            // new webpack.NamedChunksPlugin(chunk => {
            //   if (chunk.name) {
            //     return chunk.name;
            //   } else {
            //     // console.log(chunk);
            //     // debugger;
            //     // return String(++i);
            //     // 原来的代码会报错, 这里先hack一下...
            //     return [...chunk._modules][0].context
            //       ? [...chunk._modules][0].context.replace(/^\/.*\//, "")
            //       : ++i;
            //   }

            // eslint-disable-next-line no-underscore-dangle
            // return [...chunk._modules]
            //   .map(m =>
            //     path.relative(
            //       m.context,
            //       m.userRequest.substring(0, m.userRequest.lastIndexOf('.'))
            //     )
            //   )
            //   .join('_');
            // }),
            new webpack.HashedModuleIdsPlugin(),
            // ------------------------------------
            // Inject resulting css file into html...(optional)
            // ------------------------------------
            // new HtmlWebpackInlineSourcePlugin(),
            ifAnalyze
              ? new BundleAnalyzerPlugin({
                  port: "9981"
                })
              : () => {}
            // new StyleExtHtmlWebpackPlugin()
            // new CopyWebpackPlugin([
            //   {
            //     from: path.join(__dirname, './public'),
            //     to: path.join(__dirname, 'output/public')
            //   }
            // ])
          ]
        : []
    ),
    optimization: Object.assign(
      {
        splitChunks: {
          cacheGroups: {
            // ------------------------------------
            // this is for multi-entries only
            // ------------------------------------
            // commons: {
            //   name: 'commons',
            //   chunks: 'initial',
            //   minChunks: 2
            // },
            // ------------------------------------
            // vendors chunk
            // ------------------------------------
            vendors: {
              test(module) {
                // debugger
                // console.log(module, chunks);
                return (
                  /[\\/]node_modules[\\/]/.test(module.context) && !/[\\/]node_modules[\\/](react|react-dom)[\\/]/.test(module.context)
                );
              },
              name: "vendors",
              chunks: "all"
            },
            // ------------------------------------
            // react and react-dom chunk
            // ------------------------------------
            react: {
              test(module) {
                return /[\\/]node_modules[\\/](react|react-dom)[\\/]/.test(module.context);
              },
              name: "react",
              chunks: "all"
            }
          }
          // styles: {
          //   name: 'styles',
          //   test: /\.css$/,
          //   chunks: 'all',
          //   enforce: true
          // }
        }
      },
      prodMode
        ? {
            minimizer: [
              new TerserPlugin({
                parallel: true,
                sourceMap: true
              }),
              // new UglifyJsPlugin({
              //   cache: true,
              //   parallel: true,
              //   sourceMap: true // set to true if you want JS source maps
              // }),
              new OptimizeCSSAssetsPlugin({})
            ]
          }
        : {}
    )
  };
};
