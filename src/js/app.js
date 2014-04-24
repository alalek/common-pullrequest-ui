'use strict';

window.ondragstart = function() { return false; }; 

/* App Module */

var app = angular.module('app', [
  'ui.bootstrap',
  'ngSanitize',
  'ngRoute',
  'prControllers',
  'appFilters',
  'appDirectives',
  'appServices',
  'bootstrapAddons',
  'alert',
])

.config(function($routeProvider) {
  $routeProvider.
    when('/summary', {
      title: 'summary',
      templateUrl: 'partials/pr-summary.html',
      controller: 'PRSummaryCtrl'
    }).
    when('/:prId', {
      title: 'detail',
      templateUrl: 'partials/pr-detail.html',
      controller: 'PRDetailCtrl'
    }).
    otherwise({
      title: '?',
      redirectTo: '/summary'
    });
})

.run(function($location, $rootScope) {
  $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
      $rootScope.title = current.$$route.title;
  });
});
