'use strict';

(function(){

angular.module('osumo').controller('HomeController', ['$scope', '$location', 'VERSION', 'title', 'DataService', function($scope, $location, VERSION, title, DataService) {
  title('Home');

  DataService.getAvailableBundles().then(
    function(bundles) {
      if (bundles && bundles.length > 0) {
        $location.path('/kb');
        $location.replace();
      } else {
        $location.path('/install');
        $location.replace();
      }
    }
  );

  // We do this here because this page will get stuck on the Loading... and
  // will look weird.

  $scope.$watch(
    function() {
      return DataService.catastrophicFailure;
    },
    function() {
      if (DataService.catastrophicFailure) {
        $location.path("/kb"); // We redirect them to kb because kb is not as badly broken at this stage.
        $location.replace();
      }
    }
  );

}]);

})();