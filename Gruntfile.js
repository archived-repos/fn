module.exports = function(grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    clean: {
      tmp: {
        src: [ ".tmp" ]
      }
    },

    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: [
          'core/license.js',
          'core/fix-ie.js',
          'core/log.js',
          'core/fn.js'
        ],
        dest: 'dist/core.js',
      },
    },

    copy: {
      'index-tmp': {
        src: 'test/index.html',
        dest: '.tmp/index.html',
        flatten: true
      },
      'core-tmp': {
        expand: true,
        cwd: 'core',
        src: '**',
        dest: '.tmp/core'
      },
      'modules-tmp': {
        expand: true,
        cwd: 'modules',
        src: '**',
        dest: '.tmp/modules'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      'core-tmp': {
        src: [
          'core/license.js',
          'core/fix-ie.js',
          'core/log.js',
          'core/fn.js'
        ],
        dest: '.tmp/core.min.js'
      },
      'modules-tmp': {
        src: [
          'modules/**/*.js'
        ],
        dest: '.tmp/modules.min.js'
      },
      'core-dist': {
        src: [
          'core/fix-ie.js',
          'core/log.js',
          'core/fn.js'
        ],
        dest: 'dist/core.min.js'
      },
      'modules-dist': {
        src: [
          'modules/**/*.js'
        ],
        dest: 'dist/modules.min.js'
      }
    },

    injector: {
      options: {},
      tmp: {
        files: {
          '.tmp/index.html': [
            '.tmp/core.min.js',
            '.tmp/*.min.js',
            '.tmp/core/fix-ie.js',
            '.tmp/core/log.js',
            '.tmp/core/fn.js',
            '.tmp/modules/**/*.js'
          ],
        },
        options: {
          ignorePath: '.tmp',
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
          root: '.tmp',
          openInBrowser: true
        }
      }
    },

    jshint: {
      all: ['Gruntfile.js', 'modules/**/*.js']
    }

  });

  grunt.registerTask('index-serve-watch', [ 'copy:index-tmp', 'injector:tmp', 'fileserver', 'watch' ])

  // Dev Build
  grunt.registerTask('dev-build', [ 'clean:tmp', 'copy:core-tmp', 'copy:modules-tmp', 'index-serve-watch' ]);

  // Dev Build and Watch
  grunt.registerTask('dev-min', [ 'clean:tmp', 'uglify:core-tmp', 'uglify:modules-tmp', 'index-serve-watch' ]);

  // Dev Build and Watch
  grunt.registerTask('dev', ['dev-build']);

  // Dev Build and Watch
  grunt.registerTask('build', [ 'uglify:core-dist', 'concat:dist' ]);

  // Default task(s).
  grunt.registerTask('default', ['dev']);

};