const TEST_FILES = 'scripts/**/__tests__/**/*.js';
const SRC_FILES = 'scripts/**/*.js';
const BABEL_PRESETS = ["stage-0", "es2015", "react"];

import gulp from 'gulp'
import source from 'vinyl-source-stream'
import gutil from 'gulp-util'
import browserify from 'browserify'
import babel from 'babel-core/register'
babel({ presets: BABEL_PRESETS })
import babelify from 'babelify'
import watchify from 'watchify'
import notify from 'gulp-notify'

import sass from 'gulp-sass'
import autoprefixer from 'gulp-autoprefixer'
import uglify from 'gulp-uglify'
import rename from 'gulp-rename'
import buffer from 'vinyl-buffer'

import browserSync from 'browser-sync'
let reload = browserSync.reload;
import historyApiFallback from 'connect-history-api-fallback'

import mocha from 'gulp-mocha'
import istanbul from 'gulp-istanbul'
import { Instrumenter } from 'isparta'
import runSequence from 'run-sequence'

function handleErrors() {
  var args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
}

function buildScript(file, watch) {
  var props = {
    entries: ['./scripts/' + file],
    debug : true,
    transform:  [babelify.configure({presets: BABEL_PRESETS})]
  };

  // watchify() if watch requested, otherwise run browserify() once
  var bundler = watch ? watchify(browserify(props)) : browserify(props);

  function rebundle() {
    var stream = bundler.bundle();
    return stream
      .on('error', handleErrors)
      .pipe(source(file))
      .pipe(gulp.dest('./build/'))
      // If you also want to uglify it
      // .pipe(buffer())
      // .pipe(uglify())
      // .pipe(rename('app.min.js'))
      // .pipe(gulp.dest('./build'))
      .pipe(reload({stream:true}))
  }

  // listen for an update and run rebundle
  bundler.on('update', function() {
    rebundle();
    gutil.log('Rebundle...');
  });

  // run it once the first time buildScript is called
  return rebundle();
}

/*
  Styles Task
*/

gulp.task('styles', () => {
  gulp.src('./styles/**/*.scss')
    .pipe(sass({
      outputStyle: 'compressed'
    }))
    .on('error', handleErrors)
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 9', 'ff 17', 'opera 12.1', 'ios 6', 'android 4'))
    .on('error', handleErrors)
    .pipe(gulp.dest('./build/'))
    .pipe(reload({stream:true}))
});

/*
  Copy over assets
*/
gulp.task('assets', () => {
  gulp.src('./assets/**')
    .pipe(gulp.dest('./build/assets/'))
});

/*
  Browser Sync
*/
gulp.task('browser-sync', () => {
  browserSync({
    server : {},
    middleware : [ historyApiFallback() ],
    ghostMode: false
  });
});

gulp.task('scripts', () => {
  return buildScript('main.js', false); // this will run once because we set watch to false
});

/*
 * Instrument files using istanbul and isparta
 */
gulp.task('coverage:instrument', () => {
  return gulp.src(SRC_FILES)
    .pipe(istanbul({
      instrumenter: Instrumenter, // Use the isparta instrumenter (code coverage for ES6)
      babel: {presets: BABEL_PRESETS}
      // Istanbul configuration (see https://github.com/SBoudrias/gulp-istanbul#istanbulopt)
      // ...
    }))
    .pipe(istanbul.hookRequire()); // Force `require` to return covered files
});

/*
 * Write coverage reports after test success
 */
gulp.task('coverage:report', (done) => {
  return gulp.src(SRC_FILES, {read: false})
    .pipe(istanbul.writeReports({
      // Istanbul configuration (see https://github.com/SBoudrias/gulp-istanbul#istanbulwritereportsopt)
      // ...
    }));
});

/**
 * Run unit tests
 */
gulp.task('test', () => {
  return gulp.src(TEST_FILES, {read: false})
    .pipe(mocha({
      compilers: { js: babel },
      require: [__dirname + '/lib/jsdom'] // Prepare environement for React/JSX testing
    }));
});

/**
 * Run unit tests with code coverage
 */
gulp.task('test:coverage', (done) => {
  runSequence('coverage:instrument', 'test', 'coverage:report', done);
});

/**
 * Watch files and run unit tests on changes
 */
gulp.task('tdd', (done) => {
  gulp.watch([
    TEST_FILES,
    SRC_FILES
  ], ['test']).on('error', gutil.log);
});

// run 'scripts' task first, then watch for future changes
gulp.task('default', ['assets','styles','scripts','browser-sync'], () => {
  gulp.watch('styles/**/*', ['styles']); // gulp watch for stylus changes
  return buildScript('main.js', true); // browserify watch for JS changes
});
