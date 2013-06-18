'use strict';

(function(){

angular.module('osumo').controller('InstallController', ['$scope', 'VERSION', 'title', 'DataService', 'AppService', 'LocaleService', function($scope, VERSION, title, DataService, AppService, LocaleService) {
  title(LocaleService.getTranslation('Installer'));

  // Setup code
  $scope.products = [
    {id: 'firefox-os', name: 'Firefox OS'},
    {id: 'firefox', name: 'Firefox'},
    {id: 'mobile', name: 'Firefox for Android'}
  ];

  $scope.languages = [
    {id: 'en-US', name: 'English (US)'}
  ];

  $scope.languages = window.LANGUAGES;

  // Some variables
  $scope.product = null;
  $scope.locale = null;
  $scope.installed = false;
  $scope.bundles = DataService.getAvailableBundles();

  // Check if we are installed or not
  AppService.checkInstalled().then(
    function(installed) {
      $scope.installed = installed;
    },
    function(error) {
      console.log('Error checking installed', error);
      $scope.installed = true; // We use this to hide the install button on error.
    }
  );

  // Attempt auto install
  AppService.autoInstall().then(function() {
    $scope.installed = true;
    $scope.dbsDownloaded = [];
  });

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

    // TODO: move this below the check. Here so we can test easily.
    LocaleService.updateLocale($scope.locale);

    for (var i in $scope.bundles) {
      if ($scope.bundles[i].product === $scope.product && $scope.bundles[i].locale === $scope.locale) {
        $scope.untoast('install-bundle');
        $scope.toast({message: 'Already downloaded', type: 'alert'});
        return;
      }
    }

    DataService.getBundleFromSource($scope.product, $scope.locale).success(function(data, status, headers, config) {
      if (!data.docs || data.docs.length === 0 || !data.topics || data.topics.length === 0) {
        $scope.untoast('install-bundle');
        $scope.toast({message: 'Sorry, the language you selected has no documents. You can help transate at ..', type: 'alert'});
        return;
      }
      for (var oname in data) {
        // We need to merge the products.
        DataService.addData(oname, data[oname]);
      }
      $scope.bundles = DataService.getAvailableBundles();
      $scope.untoast('install-bundle');
    }).error(function(data, status, headers, config) {
      $scope.untoast('install-bundle');
      if (status === 0) {
        $scope.toast({message: 'It looks like you don\'t have a network connection.', type: 'alert'});
      } else {
        $scope.toast({message: 'Download failed. Status: ' + status, type: 'alert'});
      }
    });
  };

}]);

})();