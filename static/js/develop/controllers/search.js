'use strict';

(function() {
  angular.module('osumo').controller('SearchController', ['$scope', 'title', 'DataService', 'L10NService', function($scope, title, DataService, L10NService) {

    var sep = /\s+/g;

    L10NService.reset();
    title(L10NService._('Search'));

    $scope.query = null;
    $scope.results = null;
    $scope.error = null;
    $scope.bundle = null;
    $scope.bundles = DataService.getAvailableBundles();

    $scope.search = function() {
      var query;
      if (!$scope.query) {
        $scope.toast({message: "You need to search for something!", type: "alert"});
      } else if (!$scope.bundle) {
        $scope.toast({message: "You need to search for in a category!", type: "alert"});
      } else {
        query = $scope.query.trim().toLowerCase();
        $scope.results = DataService.search(query.split(sep), $scope.bundle);
        $scope.locale = $scope.bundle.split("~")[0];
      }
    };

  }]);
})();