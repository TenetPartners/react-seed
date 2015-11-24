var source = require('vinyl-source-stream');
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var babel = require('babel/register')({
  stage : 0 // to use ES7 experimental features
});
var babelify = require('babelify');
var watchify = require('watchify');
var notify = require('gulp-notify');

var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var buffer = require('vinyl-buffer');

var browserSync = require('browser-sync');
var reload = browserSync.reload;
var historyApiFallback = require('connect-history-api-fallback')

var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var isparta = require('isparta');
var runSequence = require('run-sequence');

// Files to process
var TEST_FILES = 'scripts/**/__tests__/**/*.js';
var SRC_FILES = 'scripts/**/*.js';

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
    transform:  [babelify.configure({stage : 0 })]
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

// gulp.task('styles',function() {
//   // move over fonts
//
//   gulp.src('css/fonts/**.*')
//     .pipe(gulp.dest('build/css/fonts'))
//
//   // Compiles CSS
//   gulp.src('css/style.styl')
//     .pipe(stylus())
//     .pipe(autoprefixer())
//     .pipe(gulp.dest('./build/css/'))
//     .pipe(reload({stream:true}))
// });

gulp.task('styles', function() {
  gulp.src('./styles/**/*.scss')
    .pipe(sass({
      outputStyle: 'compressed'
    }))
    .on('error', handleErrors)
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 9', 'ff 17', 'opera 12.1', 'ios 6', 'android 4'))
    // .on('error', continueOnError)
    .pipe(gulp.dest('./build/assets/'))
    .pipe(reload({stream:true}))
});

/*
  Copy over assets
*/
gulp.task('assets',function(){
  gulp.src('./assets/**')
    .pipe(gulp.dest('./build/assets/'))
});

/*
  Browser Sync
*/
gulp.task('browser-sync', function() {
  browserSync({
    server : {},
    middleware : [ historyApiFallback() ],
    ghostMode: false
  });
});

gulp.task('scripts', function() {
  return buildScript('main.js', false); // this will run once because we set watch to false
});

/*
 * Instrument files using istanbul and isparta
 */
gulp.task('coverage:instrument', function() {
  return gulp.src(SRC_FILES)
    .pipe(istanbul({
      instrumenter: isparta.Instrumenter, // Use the isparta instrumenter (code coverage for ES6)
      // babel: {stage : 0}
      // Istanbul configuration (see https://github.com/SBoudrias/gulp-istanbul#istanbulopt)
      // ...
    }))
    .pipe(istanbul.hookRequire()); // Force `require` to return covered files
});

/*
 * Write coverage reports after test success
 */
gulp.task('coverage:report', function(done) {
  return gulp.src(SRC_FILES, {read: false})
    .pipe(istanbul.writeReports({
      // Istanbul configuration (see https://github.com/SBoudrias/gulp-istanbul#istanbulwritereportsopt)
      // ...
    }));
});

/**
 * Run unit tests
 */
gulp.task('test', function() {
  return gulp.src(TEST_FILES, {read: false})
    .pipe(mocha({
      compilers: { js: babel },
      require: [__dirname + '/lib/jsdom'] // Prepare environement for React/JSX testing
    }));
});

/**
 * Run unit tests with code coverage
 */
gulp.task('test:coverage', function(done) {
  runSequence('coverage:instrument', 'test', 'coverage:report', done);
});

/**
 * Watch files and run unit tests on changes
 */
gulp.task('tdd', function(done) {
  gulp.watch([
    TEST_FILES,
    SRC_FILES
  ], ['test']).on('error', gutil.log);
});

// run 'scripts' task first, then watch for future changes
gulp.task('default', ['assets','styles','scripts','browser-sync'], function() {
  gulp.watch('styles/**/*', ['styles']); // gulp watch for stylus changes
  return buildScript('main.js', true); // browserify watch for JS changes
});
