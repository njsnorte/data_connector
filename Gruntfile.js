// Generated on 2015-08-07 using generator-web-data-connector 0.0.0

'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        'js/*.js',
        '!js/scripts.min.js'
      ]
    },
    concat: {
      js: {
        options: {
          separator: ';'
        },
        src: [
          'bower_components/jquery/dist/jquery.js',
          'bower_components/lodash/lodash.js',
          'bower_components/tableau/dist/*.js',
          'bower_components/material-design-lite/material.js',
          'src/util.js',
          'src/wrapper.js',
          'src/**/*.js'
        ],
        dest: 'build/js/all.js'
      },
      css: {
        src: [
          'bower_components/material-design-lite/material.css',
          'bower_components/custom/custom.css'
        ],
        dest: 'build/css/style.css'
      }
    },
    uglify: {
      options: {
        compress: true,
        mangle: true,
        sourceMap: true
      },
      target: {
        src: 'build/js/all.js',
        dest: 'build/js/all.min.js'
      }
    },
    cssmin: {
      target: {
        files: [{
          src: 'build/css/style.css',
          dest: 'build/css/style.min.css'
        }]
      }
    },
    connect: {
      server: {
        options: {
          base: './build',
          port: 9001
        }
      }
    },
    watch: {
      scripts: {
        files: ['src/**/*.js', 'bower_components/custom/*.css'],
        tasks: [
          'jshint',
          'concat',
          'cssmin',
          'uglify'
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', [
    'jshint',
    'concat',
    'cssmin',
    'uglify',
    'connect:server',
    'watch'
  ]);

  grunt.registerTask('run', [
    'connect:server',
    'watch'
  ]);
};
