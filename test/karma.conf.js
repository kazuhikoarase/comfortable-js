//
// karma configuration
//

// config

const srcDir = '../src';
const mainSrcDir = `${srcDir}/main`;
const testSrcDir = `${srcDir}/test`;
const testResultDir = 'result';

// end config

const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const coverageExcludes = /node_modules[\\\/]/;


module.exports = function(config) {

  config.set({

    basePath: '',

    frameworks: [ 'jasmine' ],

    // observe entry point and references.
    files: function() {
      return [
        `${testSrcDir}/js/**/*.html`,
        `${testSrcDir}/js/all-specs.js`,
      ];
    }(),

    preprocessors: function() {
      var ret = { 'src/test/js/**/*.html': [ 'html2js' ] };
      [ 'css', 'vue', 'ts', 'js' ].forEach(function(ext) {
        [ mainSrcDir, testSrcDir ].forEach(function(dir) {
          ret[`${dir}/**/*.${ext}`] = [ 'webpack', 'sourcemap' ];
        });
      });
      return ret;
    }(),

    html2JsPreprocessor: {
      // strip this from the file path
      stripPrefix: `${testSrcDir}/js/`,
    },

    webpack: {
      // karma watches the test entry points
      // (you don't need to specify the entry option)
      // webpack watches dependencies

      // webpack configuration
      mode: 'development', // 'development' or 'production',

      plugins: [
        new VueLoaderPlugin(),
      ],

      module: {
        rules: [
          { test: /\.css$/, use: [ 'style-loader', 'css-loader' ], },
          { test: /\.vue$/, loader: 'vue-loader' },
          { test: /\.ts$/, use : { loader: 'ts-loader',
            options: { configFile: 'test-tsconfig.json' } } },
          { // babel all.
            test: /\.js$/,
            use: {
              loader: 'babel-loader',
              options : { presets: [ '@babel/preset-env' ] }
            },
          },

          // coverages
          {
            test: /\.js$/,
            exclude: coverageExcludes,
            use: {
              loader: 'istanbul-instrumenter-loader',
              options: { esModules: true }
            },
            //?
            //enforce : 'post',
          },
          {
            test: /.ts$/,
            exclude: coverageExcludes,
            use: {
              loader: 'istanbul-instrumenter-loader',
              options: { esModules: true }
            },
            enforce : 'post',
          },
        ]
      },
    },

    webpackMiddleware: {
      // webpack-dev-middleware configuration
      // i. e.
      stats: 'errors-only'
    },

    reporters: [
      'spec',
      'html',
      'coverage-istanbul'
    ],

    htmlReporter: {
      outputFile : `${testResultDir}/units.html`
    },

    coverageIstanbulReporter: {
      type: 'html',
      dir: `${testResultDir}/coverage/`,
      //reports: ['lcov', 'text-summary'],
      includeAllSources: true,
      fixWebpackSourcePaths: true,
      skipFilesWithNoCoverage: false
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR
    //   || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests 
    // whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [
      'Chrome',
      'IE',
      //'IE9',
    ],

    customLaunchers: {
      IE9: {
        base: 'IE',
        flags: ['-extoff'], // "No add-ons mode"
        'x-ua-compatible': 'IE=EmulateIE9'
      },
      IE8: {
        base: 'IE',
        flags: ['-extoff'], // "No add-ons mode"
        'x-ua-compatible': 'IE=EmulateIE8'
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })

}
