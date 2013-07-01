'use strict';

(function() {
  angular.module('osumo').controller('SearchController', ['$scope', '$route', 'title', 'DataService', 'L10NService', function($scope, $route, title, DataService, L10NService) {

    var sep = /\s+/g;

    L10NService.reset();
    title(L10NService._('Search'));

    $scope.bundles = DataService.getAvailableBundles();
    $scope.query = $route.current.params.q ? $route.current.params.q.replace(/\+/g, " ").trim().toLowerCase() : null;
    $scope.locale = $route.current.params.locale;
    $scope.product = $route.current.params.product;

    var splitted;
    if ($scope.locale && $scope.product) {
      $scope.bundle = $scope.locale + '~' + $scope.product;
    } else {
      $scope.bundle = $route.current.params.bundle;
      if ($scope.bundle) {
        splitted = $scope.bundle.split('~');
        $scope.locale = splitted[0];
        $scope.product = splitted[1];
      }
    }

    setSearchParams($scope.locale, $scope.product);

    $scope.searching = $scope.bundle && $scope.query;
    $scope.timeTaken = -1;
    var time = new Date().getTime();
    if ($scope.searching) {

      $scope.results = DataService.search($scope.query.split(sep), $scope.bundle);
      $scope.results.then(function() {
        $scope.searching = false;
        $scope.timeTaken = (new Date().getTime() - time) / 1000;
      });
    }
  }]);
})();