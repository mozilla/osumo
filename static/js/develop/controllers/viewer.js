'use strict';

(function() {
  angular.module('osumo').controller('DocViewer', ['$scope', '$route', 'DataService', function($scope, $route, DataService) {
    $scope.locale = $route.current.params.locale;
    $scope.doc = DataService.getDoc($route.current.params.doc);
  }]);
})();