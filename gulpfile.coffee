gulp = require 'gulp'
gutil = require 'gulp-util'
parentDir = "app/"

#load all module
$ = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'gulp.*'],
	replaceString: /\bgulp[\-.]/
})

browserSync = require 'browser-sync'
reload = browserSync.reload
runSequence = require('run-sequence');

gulp.task 'default', ->
	console.log 'gulp!'

##coffee compile
#gulp.task 'coffee', ->
#	gulp
#	.src ['src/coffee/*.coffee']
#	.pipe $.plumber()
#	.pipe $.coffee()
#	.pipe gulp.dest parentDir + 'js'

#typescript compile
gulp.task 'typescript', () ->
	gulp
	.src 'src/typescript/*.ts'
	.pipe $.plumber()
	.pipe $.tsc()
	.pipe gulp.dest parentDir + 'js'

gulp.task 'sass',()->
	gulp
	.src 'src/sass/*.scss'
	.pipe $.sass()
	.pipe gulp.dest parentDir + 'css'

#compass
gulp.task 'compass',()->
	gulp
	.src 'src/sass/*.scss'
	.pipe $.compass {
		config_file: 'config.rb',
		comments: false,
		css: parentDir + 'css',
		sass: 'src/sass/'
	}

#run server / watch
gulp.task 'serve', ['default'], ->
	browserSync
		notify: false
		server:
			baseDir: [parentDir]
	gulp.watch ['src/typescript/*.ts'], ['script_type']
	gulp.watch ['src/sass/*.scss'], ['script_sass']
	gulp.watch [parentDir + '*.html'], reload

#coffee compile&reload
gulp.task 'script', ->
	runSequence 'coffee', reload

#typescript compile&reload
gulp.task 'script_type', ->
	runSequence 'typescript', reload

#sass compile&reload
gulp.task 'script_sass', ->
	runSequence 'compass', reload


