'use strict';

(function(){

angular.module('osumo').controller('HomeController', ['$scope', '$location', 'VERSION', 'title', 'DataService', function($scope, $location, VERSION, title, DataService) {
  title('Home');

  DataService.metaDbPromise.then(
    function(db) {
      var trans = db.transaction('meta');
      db.transaction('meta').objectStore('meta').get(VERSION).then(
        function(meta) {
          if (!meta.installed) {
            $location.path('/install');
            $scope.toast({message: 'Test Toast Message!', type: 'secondary'});
          } else {
            $location.path('/main');
          }
          return meta;
        },
        function(err) {

        }
      );
    },
    function(err) {

    }
  );

}]);

})();