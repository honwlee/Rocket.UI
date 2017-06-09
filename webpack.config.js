require('precss');
require('autoprefixer');
var path = require('path');
var webpack = require('webpack');
var merge = require('webpack-merge');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var autoprefixer = require('autoprefixer');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

// detemine build env
var TARGET_ENV = process.env.npm_lifecycle_event === 'build' ? 'production' : 'development';

// common webpack config
var commonConfig = {
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: '[hash].js',
    },
    resolve: {
        modules: [path.join(__dirname, "src"), 'node_modules'],
        extensions: ['.js', '.elm', '.scss']
    },
    module: {
        noParse: /\.elm$/,
        rules: [{
            test: /\.(eot|ttf|woff|woff2|svg)$/,
            use: [
                'file-loader'
            ]
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'static/index.html',
            inject: 'body',
            filename: 'index.html'
        }),
        new HtmlWebpackPlugin({
            template: 'static/spaces.html',
            inject: 'body',
            filename: 'spaces.html'
        }),
        new webpack.LoaderOptionsPlugin({
            options: {
                postcss: function() {
                    return [autoprefixer({ browsers: ['last 2 versions'] })]
                }
            }
        })
    ],
}

// additional webpack settings for local env (when invoked by 'npm start')
if (TARGET_ENV === 'development') {
    console.log('Serving locally...');
    module.exports = merge(commonConfig, {
        entry: [
            'webpack-dev-server/client?http://localhost:8080',
            'bootstrap-loader',
            path.join(__dirname, 'static/spaces.js'),
            path.join(__dirname, 'static/index.js')
        ],
        devServer: {
            inline: true,
            progress: true
        },
        module: {
            rules: [{
                test: /\.elm$/,
                exclude: [/elm-stuff/, /node_modules/],
                use: [{
                    loader: 'elm-hot-loader',
                }, {
                    loader: 'elm-webpack-loader',
                    options: {
                        verbose: true,
                        warn: true
                    }
                }]
            }, {
                test: /\.(css|scss)$/,
                use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']
            }]
        }
    });
}

// additional webpack settings for prod env (when invoked via 'npm run build')
if (TARGET_ENV === 'production') {
    console.log('Building for prod...');
    module.exports = merge(commonConfig, {
        entry: [
            'bootstrap-loader',
            path.join(__dirname, 'static/index.js'),
            path.join(__dirname, 'static/spaces.js'),
        ],
        module: {
            rules: [{
                test: /\.elm$/,
                exclude: [/elm-stuff/, /node_modules/],
                use: [
                    'elm-webpack-loader'
                ]
            }, {
                test: /\.(css|scss)$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        'css-loader', 'postcss-loader', 'sass-loader'
                    ]
                })
            }]
        },
        plugins: [
            new CopyWebpackPlugin([{
                from: 'static/img/',
                to: 'img/'
            }, {
                from: 'static/favicon.ico'
            }, ]),
            new webpack.optimize.OccurrenceOrderPlugin(),
            // extract CSS into a separate file
            new ExtractTextPlugin({
                filename: function(getPath) {
                    return getPath('./[hash].css');
                },
                allChunks: true
            }),
            // minify & mangle JS/CSS
            new webpack.optimize.UglifyJsPlugin({
                minimize: true,
                compressor: { warnings: false }
                // mangle:  true
            })
        ]
    });
}
