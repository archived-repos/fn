module.exports = function(grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'modules/**/*.js',
        dest: '<%= pkg.name %>.min.js'
      }
    },

    injector: {
      options: {},
      local_dependencies: {
        files: {
          'index.html': ['modules/**/*.js'],
        },
        options: {
          addRootSlash: false
        }
      }
    },

    watch: {
      html: {
        files: [ '**/*.html' ]
      },
      js: {
        files: [ 'modules/**/*.js' ],
        tasks: ['dev-build']
      },
      options: {
        livereload: 33444
      }
    },

    jshint: {
      all: ['Gruntfile.js', 'modules/**/*.js']
    }
  });

  // Dev Build
  grunt.registerTask('dev-build', ['injector', 'uglify']);

  // Dev Build and Watch
  grunt.registerTask('dev', ['dev-build', 'watch']);

  // Default task(s).
  grunt.registerTask('default', ['dev']);

};