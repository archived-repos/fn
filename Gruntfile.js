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
      core: {
        src: [
          'core/fix-ie.js',
          'core/log.js',
          'core/fn.js'
        ],
        dest: '<%= pkg.name %>.min.js'
      },
      modules: {
        src: [
          'modules/**/*.js'
        ],
        dest: 'modules.min.js'
      }
    },

    injector: {
      options: {},
      dev: {
        files: {
          'index.html': [
            'core/fix-ie.js',
            'core/log.js',
            'core/fn.js',
            'modules/**/*.js'
          ],
        },
        options: {
          addRootSlash: false
        }
      },
      min: {
        files: {
          'index.html': [
            '<%= pkg.main %>',
            '*.min.js'
          ],
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
        files: [ 'core/**/*.js', 'modules/**/*.js' ],
        tasks: ['dev-build']
      },
      options: {
        livereload: 33444
      }
    },

    fileserver: {
      dev: {
        options: {
          port: 8080,
          hostname: '0.0.0.0',
          root: '.',
          openInBrowser: true
        }
      }
    },

    jshint: {
      all: ['Gruntfile.js', 'modules/**/*.js']
    }

  });

  // Dev Build
  grunt.registerTask('dev-build', ['injector:dev', 'uglify']);

  // Dev Build and Watch
  grunt.registerTask('dev', ['dev-build', 'fileserver', 'watch']);

  // Dev Build and Watch
  grunt.registerTask('dev-min', ['uglify', 'injector:min', 'fileserver', 'watch']);

  // Dev Build and Watch
  grunt.registerTask('build', ['uglify', 'injector:min']);

  // Default task(s).
  grunt.registerTask('default', ['dev']);

};