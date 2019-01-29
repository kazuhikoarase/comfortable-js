//
// gulpfile for comfortable
//

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

var targetName = 'comfortable';

var mainTsSrc = [ 'src/main/ts/**/*.ts' ];
var mainCssSrc = [ 'src/main/ts/**/*.css' ];

var build = 'lib';

var mainTsProject = ts.createProject({
  noImplicitAny : true,
  declaration : true,
  stripInternal : true,
  outFile : `${targetName}.js`
});

gulp.task('clean', function() {
  return del([ `${build}/*` ]);
});

gulp.task('build-main', function() {
  return gulp.src(mainTsSrc)
    .pipe(plumber({
      errorHandler : notify.onError({
        title : 'error in <%= error.plugin %>',
        message : '<%= error.message %>'
      })
    }) )
    .pipe(sourcemaps.init() )
    .pipe(order([ '**/*.ts' ]) )
    .pipe(mainTsProject() )
    .pipe(sourcemaps.write('.') )
    .pipe(gulp.dest(build) );
});

gulp.task('concat-main-css', function() {
  return gulp.src(mainCssSrc)
    .pipe(order([ '**/*.css' ]) )
    .pipe(concat(targetName + '.css') )
    .pipe(gulp.dest(`${build}/`) );
});

gulp.task('build', gulp.series('build-main', 'concat-main-css') );

gulp.task('compress', gulp.series('build', function() {
  return gulp.src(`${build}/${targetName}.js`)
    .pipe(uglify({ output : { ascii_only : true } }) )
    .pipe(rename({ suffix: '.min' }) )
    .pipe(gulp.dest(`${build}/`) );
}) );

gulp.task('watch', function() {
  var src = mainTsSrc.concat(mainCssSrc);
  gulp.watch(src, gulp.series('compress') )
    .on('change', function(path) {
      console.log(path);
    });
});

gulp.task('default', gulp.series('clean', 'compress') );
