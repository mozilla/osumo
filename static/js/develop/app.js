'use strict';

(function() {

var app = angular.module('osumo', ['angularIndexedDb']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $routeProvider.when('/', {
    templateUrl: '/static/partials/loading.html',
    controller: 'HomeController'
  });

  $routeProvider.when('/install', {
    templateUrl: '/static/partials/install.html',
    controller: 'InstallController'
  });

  $routeProvider.when('/main', {
    templateUrl: '/static/partials/main.html',
    controller: 'MainController'
  });
}]);

app.factory('title', ['$window', function($window){
  return function(title) {
      $window.document.title = title + ' - Offline Mozilla Support';
  };
}]);

app.constant('VERSION', 1);

app.run(['$rootScope', function($rootScope) {
  $rootScope.toast = function(toast, id) {
    toast.autoclose = toast.autoclose === undefined ? true : false;
    $rootScope.$broadcast('toast', toast, id);
  };
}])

})();