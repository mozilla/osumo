'use strict';

(function() {
  angular.module('osumo').controller('ToastController', ['$scope', function($scope) {

    $scope.html = null;
    $scope.showclose = true;
    $scope.active = false;

    $scope.$on('toast', function(event, toast) {
      $scope.showclose = toast.showclose || true;
      $scope.html = toast.message;
    });

    $scope.$on('untoast', function(event) {
      $scope.untoast();
    });

    $scope.untoast = function(id) {
      $scope.html = null;
      $scope.showclose = true;
      $scope.active = false;
    };
  }]);
})();