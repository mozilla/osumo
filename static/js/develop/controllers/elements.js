'use strict';

(function() {

  var module = angular.module('osumo');
  module.controller('ToastController', ['$scope', '$timeout', function($scope, $timeout) {

    $scope.html = null;
    $scope.showclose = true;
    $scope.active = false;

    $scope.$on('toast', function(event, toast) {
      $scope.showclose = toast.showclose || true;
      $scope.html = toast.message;
      $scope.active = true;
      if (toast.autoclose) {
        $scope.showclose = false;
        $timeout($scope.untoast, toast.autoclose);
      }
    });

    $scope.$on('untoast', function(event) {
      $scope.untoast();
    });

    $scope.untoast = function() {
      $scope.html = null;
      $scope.showclose = true;
      $scope.active = false;
    };
  }]);

  module.controller('NavbarController', ['$scope', 'L10NService', 'DataService', function($scope, L10NService, DataService) {
    $scope.locale = L10NService.currentLocale;

    $scope.$on('locale-changed', function(e, locale) {
      $scope.locale = locale;
    });
  }]);


})();