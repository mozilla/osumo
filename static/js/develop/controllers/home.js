'use strict';

(function(){

angular.module('osumo').controller('HomeController', ['$scope', '$location', 'VERSION', 'title', 'DataService', function($scope, $location, VERSION, title, DataService) {
  title('Home');

  DataService.settingsDb.then(
    function(db) {
      var trans = db.transaction('meta');
      db.transaction('meta').objectStore('meta').get(VERSION).then(
        function(meta) {
          if (!meta || !meta.installed) {
            $location.path('/install');
          } else {
            $location.path('/kb');
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