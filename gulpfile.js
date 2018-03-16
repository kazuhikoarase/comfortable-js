
const gulp = require('gulp');
const del = require('del');
const runSequence = require('run-sequence');
const rename = require('gulp-rename');
const order = require('gulp-order');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const jasmine = require('gulp-jasmine');

var targetName = 'comfortable';

var jsSrc = [
  'src/main/js/**/*.js',
  'src/main/js/**/*.css',
  'src/test/js/**/*.js'
];

gulp.task('clean', function() {
  return del([ 'lib/*' ]);
});

gulp.task('watch', function(){
  gulp.watch(jsSrc, ['concat-main']).on('change', function(event) {
    console.log(event.path + ' [' + event.type + ']');
  });
});

gulp.task('concat-main-css', function() {
  return gulp.src([ 'src/main/js/**/*.css' ])
    .pipe(order([ '**/*.css']) )
    .pipe(concat(targetName + '.css') )
    .pipe(gulp.dest('lib/') );
});

gulp.task('concat-main', ['concat-main-css'], function() {
  return gulp.src([ 'src/main/js/**/*.js' ])
    .pipe(order([ '**/*.js']) )
    .pipe(concat(targetName + '.js') )
    .pipe(gulp.dest('lib/') );
});

gulp.task('concat-test', function() {
  return gulp.src([ 'src/test/js/**/*.spec.js' ])
    .pipe(order([ '**/*.js']) )
    .pipe(concat(targetName + '.spec.js') )
    .pipe(gulp.dest('lib/') );
});

gulp.task('compress', ['concat-main'], function () {
  return gulp.src('lib/' + targetName + '.js')
    .pipe(uglify({ output : { ascii_only : true } }) )
    .pipe(rename({ suffix: '.min' }) )
    .pipe(gulp.dest('lib/') );
});

gulp.task('jasmine', ['concat-main','concat-test'], function() {
  return gulp.src('lib/' + targetName + '.spec.js')
  .pipe(jasmine() );
});

gulp.task('default', ['compress', 'jasmine']);
