'use strict';

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-bowercopy');

  grunt.initConfig({
    bowercopy : {
      options : {
        destPrefix : 'src/3rdparty',
      },
      lodash : {
        files : {
          'lodash' : 'lodash/dist'
        }
      },
      jquery : {
        files : {
          'jquery/' : 'jquery/jquery*.js'
        }
      },
      angular : {
        files : {
          'angular/' : 'angular/angular*'
        }
      },
      bootstrap : {
        files : {
          'bootstrap' : 'bootstrap/dist'
        }
      },
      "angular-bootstrap" : {
        files : {
          'angular/' : 'angular-bootstrap/ui-bootstrap*'
        }
      },
      "angular-route" : {
        files : {
          'angular/' : 'angular-route/angular*'
        }
      },
      "angular-resource" : {
        files : {
          'angular/' : 'angular-resource/angular*'
        }
      },
      "angular-sanitize" : {
        files : {
          'angular/' : 'angular-sanitize/angular*'
        }
      },
      marked : {
        files : {
          'marked' : 'marked/lib'
        }
      },
    }
  });
};
