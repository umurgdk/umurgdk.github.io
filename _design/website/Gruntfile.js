var path = require('path');

var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;

var folderMount = function folderMount(connect, point) {
	return connect.static(path.resolve(point));
};

module.exports = function (grunt) {

	grunt.initConfig({
		coffee: {
			glob_to_multiple: {
				expand: true,
				flatten: true,
				cwd: 'coffee/',
				src: ['*.coffee'],
				dest: 'public/js',
				ext: '.js'
			}
		},
		less: {
			development: {
				options: {
					paths: ["less"]
				},
				files: {
					"public/css/application.css": "less/application.less"
				}
			}
		},

		livereload: {
			port: 35729 // Default livereload listening port.
		},

		connect: {
			livereload: {
				options: {
					base: './public',
					port: 9001,
					middleware: function(connect, options) {
						return [lrSnippet, folderMount(connect, options.base)]
					}
				}
			}
		},

		watch: {
			coffee: {
				files: 'coffee/**/*.coffee',
				tasks: ['coffee', 'livereload']
			},

			less: {
				files: 'less/**/*.less',
				tasks: ['less', 'livereload']
			},

			html: {
				files: 'public/index.html', 
				tasks: ['livereload']
			}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-coffee');
	grunt.loadNpmTasks('grunt-contrib-less')
	grunt.loadNpmTasks('grunt-contrib-livereload');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task(s).
	grunt.registerTask('default', ['coffee', 'less', 'connect', 'livereload-start', 'watch']);
};