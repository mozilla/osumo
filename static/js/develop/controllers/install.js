'use strict';

(function(){

angular.module('osumo').controller('InstallController', ['$q', '$scope', 'VERSION', 'title', 'DataService', 'AppService', 'L10NService', 'PlatformService', function($q, $scope, VERSION, title, DataService, AppService, L10NService, PlatformService) {
  L10NService.reset();
  setSearchParams();
  title(L10NService._('Installer'));

  // Setup code

  $scope.languages = window.LANGUAGES;

  // Some variables
  if (PlatformService.OS === 'fxos') {
    $scope.product = 'firefox-os';
  } else if (PlatformService.browser === 'm') {
    $scope.product = 'mobile';
  } else {
    $scope.product = 'firefox';
  }

  $scope.locale = L10NService.defaultLocale;
  $scope.installed = false;
  $scope.bundles = DataService.getAvailableBundles();

  /**
   * Checks if a product is downloaded (in conjucture with the current
   * selected locale)
   */
  $scope.isProductDownloaded = function(product) {
    var deferred = $q.defer()
    $scope.bundles.then(function(bundles) {

      // Since we don't really have a lot of things in bundles. This should be
      // fine.
      for (var i=0; i<bundles.length; i++) {
        if (bundles[i].locale === $scope.locale && bundles[i].product === product) {
          deferred.resolve(true);
          break;
        }
      }

      deferred.resolve(false);
    });
    return deferred.promise;
  };


  $scope.downloading = {
    firefox: false,
    'firefox-os': false,
    mobile: false
  };

  $scope.downloaded = {
    firefox: false,
    'firefox-os': false,
    mobile: false
  };

  $scope.checkedDownloadedForCurrentLocale = function() {
    $scope.downloaded['firefox'] = false;
    $scope.downloaded['firefox-os'] = false;
    $scope.downloaded['mobile'] = false;
    $scope.bundles.then(function(bundles) {
      for (var i=0; i<bundles.length; i++) {
        if (bundles[i].locale === $scope.locale) {
          $scope.downloaded[bundles[i].product] = true;
        }
      }
    });
  };

  $scope.checkedDownloadedForCurrentLocale();

  // Check if we are installed or not. Reason we need this is for failure.
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


  $scope.download = function(product) {
    $scope.downloading[product] = true;

    $scope.bundles.then(function(bundles) {
      for (var i in bundles) {
        if (bundles[i].product === product && bundles[i].locale === $scope.locale) {
          // Send out a toast message saying already downloaded.
          return;
        }
      }

      DataService.getBundleFromSource(product, $scope.locale).success(function(data, status, headers) {
        if (!data.docs || data.docs.length === 0 || !data.topics || data.topics.length === 0) {
          $scope.toast({message: L10NService._('There are no documents for this language.'), type: 'error', showclose: true});
          $scope.downloading[product] = false;
          return;
        }

        var storeOps = [];
        for (var objectStoreName in data) {
          storeOps.push(DataService.addData(objectStoreName, data[objectStoreName]));
        };

        $q.all(storeOps).then(function() {
          $scope.toast({message: L10NService._('Downloaded!'), type: 'success', autoclose: 1500});
          $scope.downloading[product] = false;
          $scope.downloaded[product] = true;
          $scope.bundles = DataService.getAvailableBundles();
        });
      }).error(function(data, status, headers) {
        if (status === 0) {
          $scope.toast({message: L10NService._('It seems like you don\'t have a network connection'), type: 'error'});
        } else {
          $scope.toast({message: L10NService._('Downloading product failed with: ' + status)});
        }
        $scope.downloading[product] = false;
      });
    });
  };

}]);

})();