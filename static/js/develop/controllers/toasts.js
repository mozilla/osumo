'use strict';

(function() {

  var c = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var randId = function(length) {
    var choice, s;
    length = length || 8; // TODO: someone do the math to show the chance of collision?
    s = "";
    for (var i=0; i<length; i++) {
      choice = Math.floor(Math.random() * c.length);
      s += c.slice(choice, choice+1);
    }
    return s;
  };

  angular.module('osumo').controller('ToastsController', ['$scope', function($scope) {

    $scope.toasts = {};

    $scope.$on('toast', function(event, toast, id) {
      id = id || randId();
      toast.showclose = toast.showclose || true;
      $scope.toasts[id] = toast;
    });

    $scope.untoast = function(id) {
      $scope.$apply(function() {
        delete $scope.toasts[id];
      });
    };

  }]);

})();