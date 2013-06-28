'use strict';

(function() {
  angular.module('osumo').controller('SearchController', ['$scope', '$route', 'title', 'DataService', 'L10NService', function($scope, $route, title, DataService, L10NService) {

    var sep = /\s+/g;

    L10NService.reset();
    title(L10NService._('Search'));

    var query = $route.current.params.q.replace(/\+/g, " ").trim().toLowerCase();
    var bundle = $route.current.params.bundle;
    var product, locale, splitted;

    if (query && bundle) {
      splitted = bundle.split('~');
      locale = splitted[0];
      product = splitted[1];
      setSearchParams(locale, product);
      $scope.results = DataService.search(query.split(sep), bundle);
      $scope.locale = locale;

    } else if (!query) {
      setSearchParams(locale, product);
      $scope.toast({message: "You need to search for something!", type: "alert"});
    } else if (!bundle) {
      setSearchParams(locale, product);
      $scope.toast({message: "You need to search for in a category!", type: "alert"});
    }
  }]);
})();