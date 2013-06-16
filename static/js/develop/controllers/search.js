'use strict';

(function() {
  angular.module('osumo').controller('SearchController', ['$scope', 'title', 'DataService', 'LocaleService', function($scope, title, DataService, LocaleService) {

    var sep = /\s+/g;

    title(LocaleService.getTranslation('Search'));

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