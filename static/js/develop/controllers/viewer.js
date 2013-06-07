'use strict';

(function() {
  angular.module('osumo').controller('DocViewer', ['$scope', '$route', '$location', 'title', 'DataService', function($scope, $route, $location, title, DataService) {

    $scope.locale = $route.current.params.locale;
    $scope.doc = DataService.getDoc($scope.locale, $route.current.params.doc);
    $scope.doc.then(function(doc) {
      title(doc.title);
      if (doc.redirect) {
        $location.path(doc.redirect);
      }
    });
  }]);
})();