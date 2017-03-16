"use strict";

import gulp from 'gulp';
import rename from 'gulp-rename';
import source from 'vinyl-source-stream';
import rimraf from 'rimraf';
import browserify from 'browserify';
import glob from 'glob';
import es from 'event-stream';
import connect from 'gulp-connect';

gulp.task('clean', (cb) => {
  rimraf('./build', cb);
});

gulp.task('build:js', (cb) => {
  glob('src/**/*.js', function(err, files) {
    if(err) cb(err);

    let tasks = files.map(function(entry) {
      return browserify({ entries: [entry] })
        .transform("babelify", {presets: ["es2015"]})
        .bundle()
        .pipe(source(entry))
        .pipe(rename({dirname: ''}))
        .pipe(gulp.dest('./build/assets/js'));
    });
    es.merge(tasks).on('end', cb);
  })
});

gulp.task('build:schema', () => {
  return gulp.src('src/**/*.json')
    .pipe(rename({dirname: ''}))
    .pipe(gulp.dest('./build/assets/schema'));
});

gulp.task('build', gulp.parallel('build:js', 'build:schema'));

gulp.task('connect:server', () => {
  return connect.server({
    root: '.',
    port: '9001',
    livereload: true
  });
});

gulp.task('connect:reload', () => {
  return gulp.src('./index.html')
    .pipe(connect.reload());
});

gulp.task('watch', () => {
  return gulp.watch(['./src/*.js', './src/**/*.js'], gulp.series('build', 'connect:reload'));
});

gulp.task('default', gulp.series('clean', 'build', gulp.parallel('connect:server', 'watch')));
