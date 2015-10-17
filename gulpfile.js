var gulp = require('gulp');
var runSequence = require('run-sequence');
var del = require('del');
var templateCache = require('gulp-angular-templatecache');

gulp.task('clean', function (cb) {
  return del([
    'dist/**/*',
  ], function (err, deletedFiles) {
    console.log('Files deleted:', deletedFiles.join(', '));
    cb(err, deletedFiles);
  });
});

gulp.task('build:copy', function() {
  return gulp.src([
        'src/**/*',
        '!src/partials/**/*'
     ])
    .pipe(gulp.dest('dist'));
});

gulp.task('templates', ['build:copy'], function () {
  return gulp.src('src/partials/**/*.html')
    .pipe(templateCache('js/templates.js', {root: 'partials'}))
    .pipe(gulp.dest('dist'));
});

gulp.task('build:all', ['templates', 'build:copy']);

gulp.task('build', function(cb) {
  console.log("Build started");
  runSequence(
      'clean',
      'build:all',
      cb);
});

gulp.task('watch', function() {
  gulp.watch('src/**/*', ['build']);
});

gulp.task('default', ['build']);
