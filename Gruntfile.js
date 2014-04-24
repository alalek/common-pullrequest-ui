'use strict';

module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-bowercopy');
	
	grunt.initConfig({
	    bowercopy: {
	        options: {
                destPrefix: 'src/3rdparty',
	        },
	        angular: {
	            files: {
	            	'angular/': 'angular/angular*'
	            }
	        },
	        bootstrap: {
	            files: {
	            	'bootstrap': 'bootstrap/dist'
	            }
	        },
	        "angular-route": {
	            files: {
	            	'angular/': 'angular-route/angular*'
	            }
	        },
	        "angular-resource": {
	            files: {
	            	'angular/': 'angular-resource/angular*'
	            }
	        },
	        jquery: {
	            files: {
	            	'jquery/': 'jquery/jquery*.js'
	            }
	        },
	    }
	});
};
