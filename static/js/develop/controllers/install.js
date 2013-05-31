'use strict';

(function(){

angular.module('osumo').controller('InstallController', ['$scope', 'VERSION', 'title', 'DataService', 'AppService', function($scope, VERSION, title, DataService, AppService) {
  title('Installer');

  $scope.product = null;
  $scope.language = null;
  $scope.installed = false;
  $scope.dbsDownloaded = [];

  DataService.metaDbPromise.then(function(db) {
    db.transaction('meta').objectStore('meta').get(VERSION).then(
      function(meta) {
        $scope.installed = meta.installed;
        $scope.dbsDownloaded = meta.dbsDownloaded;
        return meta;
      },
      function(err) {
        console.log('Getting meta db failed: ' + err);
      }
    );
    return db;
  });

  AppService.autoInstall().then(function() {
    $scope.installed = true;
    $scope.dbsDownloaded = [];
  });

  $scope.installApp = function() {
    if ($scope.installed) {
      return;
    }

    AppService.install().then(
      function() {
        $scope.installed = true;
        $scope.toast({message: 'Installation successful!', type: 'success'});
      },
      function(err) {
        $scope.toast({message: 'Installation failed: ' + err, type: 'alert'});
      }
    );

  };

  $scope.installBundle = function() {

  };

}]);

})();