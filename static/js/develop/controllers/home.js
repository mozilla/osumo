'use strict';

(function(){

angular.module('osumo').controller('HomeController', ['$scope', '$location', 'VERSION', 'title', 'DataService', function($scope, $location, VERSION, title, DataService) {
  title('Home');

  DataService.getAvailableBundles().then(function(bundles) {
    if (bundles && bundles.length > 0) {
      $location.path('/kb');
    } else {
      $location.path('/install');
    }
  });

}]);

})();