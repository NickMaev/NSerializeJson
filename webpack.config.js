const path = require('path');
const webpack = require('webpack');
const bundleOutputDir = './build';

module.exports = (env) => {
    const isDevBuild = !(env && env.prod);
    return [{
        mode: "none",
        stats: { modules: false },
        entry: { 'main': './index.ts' },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.less', '.sass', '.scss']
        },
        output: {
            filename: 'nserializejson.min.js',
            path: path.join(__dirname, 'dist', 'browser'),
            library: "NSerializeJson",
            libraryTarget: "umd",
            globalObject: "typeof self !== 'undefined' ? self : this"
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    include: /src/,
                    exclude: /node_modules/,
                    use: [{
                            loader: 'babel-loader',
                            options: {
                                plugins: [require('babel-plugin-add-module-exports')]
                            }
                        },
                        'ts-loader']
                },
            ]
        },
        plugins: [
        ].concat(isDevBuild ? [
            // Plugins that apply in development builds only
            new webpack.SourceMapDevToolPlugin({
                filename: '[file].map', // Remove this line if you prefer inline source maps
                moduleFilenameTemplate: path.relative(bundleOutputDir, '[resourcePath]') // Point sourcemap entries to the original file locations on disk
            })
        ] : [
                // Plugins that apply in production builds only
                new webpack.optimize.UglifyJsPlugin()
            ])
    }];
};
