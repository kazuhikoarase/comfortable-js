
const del = require('del');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const rename = require('gulp-rename');
const order = require('gulp-order');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const jasmine = require('gulp-jasmine');

var targetName = 'comfortable';

var mainTsSrc = [ 'src/main/ts/**/*.ts' ];
var testTsSrc = [ 'src/test/ts/**/*.ts' ];

var build = 'lib';

var mainTsProject = ts.createProject({
  noImplicitAny : true,
  declaration : true,
  outFile : `${targetName}.js`
});

var testTsProject = ts.createProject({
  noImplicitAny : true,
  declaration : false,
  outFile : `${targetName}.spec.js`
});

gulp.task('clean', function() {
  return del([ `${build}/*` ]);
});

gulp.task('concat-main-css', function() {
  return gulp.src([ 'src/main/ts/**/*.css' ])
    .pipe(order([ '**/*.css']) )
    .pipe(concat(targetName + '.css') )
    .pipe(gulp.dest(`${build}/`) );
});

gulp.task('build-main', gulp.series('concat-main-css', function() {
  return gulp.src(mainTsSrc)
    .pipe(plumber({
      errorHandler : notify.onError({
        title : 'error in <%= error.plugin %>',
        message : '<%= error.message %>'
      })
    }) )
    .pipe(sourcemaps.init() )
    .pipe(mainTsProject() )
    .pipe(sourcemaps.write('.') )
    .pipe(gulp.dest(build) );
}) );

gulp.task('build-test', gulp.series('build-main', function() {
  return gulp.src(testTsSrc)
    .pipe(plumber({
      errorHandler : notify.onError({
        title : 'error in <%= error.plugin %>',
        message : '<%= error.message %>'
      })
    }) )
    .pipe(sourcemaps.init() )
    .pipe(testTsProject() )
    .pipe(sourcemaps.write('.') )
    .pipe(gulp.dest(build) );
}) );

gulp.task('build', gulp.series('build-test') );

gulp.task('compress', gulp.series('build', function () {
  return gulp.src(`${build}/${targetName}.js`)
    .pipe(uglify({ output : { ascii_only : true } }) )
    .pipe(rename({ suffix: '.min' }) )
    .pipe(gulp.dest(`${build}/`) );
}) );

gulp.task('jasmine', gulp.series('build', function() {
  return gulp.src(`${build}/${targetName}.spec.js`)
  .pipe(jasmine() );
}) );

gulp.task('watch', gulp.series('jasmine', function(){
  gulp.watch(mainTsSrc.concat(testTsSrc), gulp.series('jasmine') )
    .on('change', function(path) {
      console.log(path);
    });
}) );

gulp.task('default', gulp.series('clean', 'jasmine') );
