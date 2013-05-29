'use strict';

(function(){

angular.module('osumo').controller('InstallController', ['$scope', 'VERSION', 'title', 'DataService', function($scope, VERSION, title, DataService) {
  title('Installer');

  var APP_URL = BASE_URL + 'manifest.webapp';

  $scope.product = null;
  $scope.language = null;
  $scope.installed = false;

  DataService.metaDbPromise.then(function(db) {
    db.transaction('meta').objectStore('meta').get(VERSION).then(
      function(meta) {
        $scope.installed = meta.installed;
        $scope.dbsDownloaded = meta.dbsDownloaded;
        return meta;
      },
      function() {

      }
    );
    return db;
  });

  $scope.installApp = function() {
    if ($scope.installed) {
      return;
    }

    var request = navigator.mozApps.checkInstalled(APP_URL);
    request.onsuccess = function() {
      if (request.result) {
        // already installed!
      } else {
        var installRequest = navigator.mozApps.install(APP_URL);
        installRequest.onsuccess = function() {
          console.log('Installed');
          $scope.$apply(function() {
            $scope.installed = true;
          });
        };

        installRequest.onerror = function(err) {
          console.log(err);
        };
      }
    };

    request.onerror = function() {

    };
  };

  $scope.installBundle = function() {

  };

}]);

})();