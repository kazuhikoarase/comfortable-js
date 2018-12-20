
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

var build = 'lib';

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
    }))
    .pipe(sourcemaps.init())
    .pipe(ts({
      noImplicitAny : true,
      declaration : true,
      outFile : `${targetName}.js`
    }) )
    .pipe(sourcemaps.write('.') )
    .pipe(gulp.dest(build) );
}) );

gulp.task('build', gulp.series('build-main', 'concat-main-css') );

gulp.task('watch', gulp.series('build', function(){
  gulp.watch(mainTsSrc, gulp.series('build') )
    .on('change', function(path) {
      console.log(path);
    });
} ) );

//gulp.task('concat-main', gulp.series('concat-main-css', function() {
//  return gulp.src([ 'src/main/js/**/*.js' ])
//    .pipe(plumber({
//      errorHandler : notify.onError({
//        title : 'error in <%= error.plugin %>',
//        message : '<%= error.message %>'
//      })
//    }))
//    .pipe(sourcemaps.init())
//    .pipe(order([ '**/*.js']) )
//    .pipe(concat(targetName + '.js') )
//    .pipe(sourcemaps.write('.') )
//    .pipe(gulp.dest('lib/') );
//}) );

//gulp.task('concat-test', function() {
//  return gulp.src([ 'src/test/js/**/*.spec.js' ])
//    .pipe(order([ '**/*.js']) )
//    .pipe(concat(targetName + '.spec.js') )
//    .pipe(gulp.dest('lib/') );
//});

gulp.task('compress', gulp.series('build', function () {
  return gulp.src(`${build}/${targetName}.js`)
    .pipe(uglify({ output : { ascii_only : true } }) )
    .pipe(rename({ suffix: '.min' }) )
    .pipe(gulp.dest(`${build}/`) );
}) );

//gulp.task('jasmine', gulp.series('concat-main','concat-test', function() {
//  return gulp.src('lib/' + targetName + '.spec.js')
//  .pipe(jasmine() );
//}) );

//gulp.task('default', gulp.series('compress', 'jasmine') );
gulp.task('default', gulp.series('clean', 'compress') );
