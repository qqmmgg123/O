var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');

gulp.task('less', function () {
  return gulp.src('./public/less/*.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest('./public/css'));
});

// д╛хохннЯ
gulp.task('default', function() {
    gulp.run('less');

    gulp.watch([
        './public/less/*.less',
        ], function(event) {
        gulp.run('less');
    });
});