'use strict';

(function() {

var app = angular.module('osumo', []);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    var homePage = {
        templateUrl: '/static/partials/home.html',
        controller: 'HomeController'
    };

    $routeProvider.when('/', homePage)
                  .when('/home', homePage);

}]);

app.factory('title', ['$window', function($window){
    return function(title) {
        $window.document.title = title + ' - Offline Mozilla Support';
    };
}]);
})();