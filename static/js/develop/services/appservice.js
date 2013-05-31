'use strict';

(function(){
  angular.module('osumo').service('AppService', ['$q', '$rootScope', 'VERSION', 'DataService', function($q, $rootScope, VERSION, DataService) {

    var _initializeDatabase = function(d) {
      DataService.metaDbPromise.then(function(db) {
        db.transaction('meta', 'readwrite').objectStore('meta').put({
          version: VERSION,
          installed: true,
          dbsDownloaded: []
        }).then(function() {
          d.resolve();
          $rootScope.$$phase || $rootScope.$apply();
        }, function(err) {
          d.reject(err);
          $rootScope.$$phase || $rootScope.$apply();
        });
      });
      $rootScope.$$phase || $rootScope.$apply();
    };

    this.compatible = function(deferred) {
      if (!window.navigator.mozApps) {
        if (deferred) {
          deferred.reject('Your browser is not compatible. Try using Firefox!');
        }
        console.log('Incompatible browser..');
        return false;
      }
      return true;
    };

    // This function is for the case where we are already installed to fxos
    this.autoInstall = function() {

      var d = $q.defer();

      if (this.compatible(d)) {
        var request = window.navigator.mozApps.getSelf();
        request.onsuccess = function(e) {
          if (request.result) {
            DataService.metaDbPromise.then(function(db) {
              db.transaction('meta').objectStore('meta').get(VERSION).then(function(value) {
                if (value === undefined || !value.installed) {
                  console.log('We are already running as an app. Initializing the database.');
                  _initializeDatabase(d);
                }
              });
            });
            $rootScope.$$phase || $rootScope.$apply();
          } else {
            d.reject('not installed');
            $rootScope.$$phase || $rootScope.$apply();
          }
        };
      }
      return d.promise;
    };

    this.install = function() {
      var d = $q.defer();

      if (this.compatible(d)) {
        var promise = this.autoInstall();

        promise.then(undefined, function(reason) {
          if (reason === 'not installed') {
            var install = window.navigator.mozApps.install(BASE_URL + 'manifest.webapp');
            install.onsuccess = function() {
              _initializeDatabase(d);
            };

            install.onerror = function(e) {
              d.reject(e.target.error.name);
              $rootScope.$$phase || $rootScope.$apply();
            };
          }
        });

      }

      return d.promise;
    };

  }]);
})();