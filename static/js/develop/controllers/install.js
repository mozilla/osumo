'use strict';

(function(){

angular.module('osumo').controller('InstallController', ['$scope', 'VERSION', 'title', 'DataService', 'AppService', function($scope, VERSION, title, DataService, AppService) {
  title('Installer');

  // Setup code
  $scope.products = [
    {id: 'firefox-os', name: 'Firefox OS'},
    {id: 'firefox', name: 'Firefox'},
    {id: 'mobile', name: 'Firefox for Android'}
  ];

  $scope.languages = [
    {id: 'en-US', name: 'English (US)'}
  ];

  // Get a list of languages from the server.
  DataService.getLanguages().success(function(data, status, headers, config) {
    $scope.languages = [];
    var l = data.languages.length;
    var languages = data.languages;
    for (var i=0; i<l; i++) {
      $scope.languages.push({id: languages[i][0], name: languages[i][1]});
    }
  });

  // Some variables
  $scope.product = null;
  $scope.locale = null;
  $scope.installed = false;
  $scope.bundles = [];
  $scope.dbsDownloaded = [];

  // Check if we are installed or not
  DataService.settingsDb.then(function(db) {
    db.transaction('meta').objectStore('meta').get(VERSION).then(
      function(meta) {
        if (meta) {
          $scope.installed = meta.installed;
          $scope.dbsDownloaded = meta.dbsDownloaded;
        }
        return meta;
      },
      function(err) {
        console.log('Getting meta db failed: ' + err);
      }
    );
    return db;
  });

  // Attempt auto install
  AppService.autoInstall().then(function() {
    $scope.installed = true;
    $scope.dbsDownloaded = [];
  });


  // Get the installed bundles
  var _updateAvailableBundles = function() {
    DataService.getAvailableBundles().then(function(bundles) {
      $scope.bundles = bundles;
    });
  };

  _updateAvailableBundles();

  // Setup is now completed. Onto the scope function declarations.

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
    $scope.toast({message: 'Downloading content...'}, 'install-bundle');

    for (var i in $scope.bundles) {
      if ($scope.bundles[i].product === $scope.product && $scope.bundles[i].locale === $scope.locale) {
        $scope.untoast('install-bundle');
        $scope.toast({message: 'Already downloaded', type: 'alert'});
        return;
      }
    }

    DataService.getBundleFromSource($scope.product, $scope.locale).success(function(data, status, headers, config) {
      for (var oname in data) {
        // We need to merge the products.
        DataService.addData(oname, data[oname]);
      }
      _updateAvailableBundles();
      $scope.untoast('install-bundle');
    }).error(function(data, status, headers, config) {
    });
  };

}]);

})();