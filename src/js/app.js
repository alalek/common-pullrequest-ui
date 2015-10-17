'use strict';

window.ondragstart = function() { return false; };

/* App Module */

var app = angular.module('app', [
  'ui.bootstrap',
  'ngSanitize',
  'ngRoute',
  'templates',
  'prControllers',
  'appFilters',
  'appDirectives',
  'appServices',
  'bootstrapAddons',
  'alert',
  'fixed.table.header',
])

.config(function($routeProvider) {
  $routeProvider.
    when('/summary/', {
      title: 'summary',
      templateUrl: 'partials/pr-summary.html',
      controller: 'PRSummaryCtrl'
    }).
    when('/summary/:repoName', {
      title: 'summary',
      templateUrl: 'partials/pr-summary.html',
      controller: 'PRSummaryCtrl'
    }).
    otherwise({
      title: '?',
      redirectTo: '/summary'
    });
})

.run(function($location, $rootScope) {
  $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
      $rootScope.title = current.$$route.title;
      $rootScope.repoName = current.params.repoName;
  });
});

angular.module("templates", []);
