'use strict';

(function() {
  angular.module('osumo').controller('DocViewer', ['$scope', '$route', 'DataService', function($scope, $route, DataService) {
    $scope.locale = $route.current.params.locale;
    $scope.product = $route.current.params.product;
    $scope.topic = $route.current.params.topic;
    $scope.doc = DataService.getDoc($route.current.params.doc);
  }]);
})();