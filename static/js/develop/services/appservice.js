'use strict';

(function(){
  angular.module('osumo').service('AppService', ['$q', '$rootScope', 'VERSION', 'DataService', function($q, $rootScope, VERSION, DataService) {

    /**
     * Private method to initialize the database after after installation.
     *
     * @param {deferred} d  A deferred to resolve or reject once the operation
     *                      is completed.
     */
    var _initializeDatabase = function(d) {
      $rootScope.$safeApply(function() {
        DataService.settingsDb.then(function(db) {
          db.transaction('meta', 'readwrite').objectStore('meta').put({
            version: VERSION,
            installed: true
          }).then(
            function() {
              $rootScope.$safeApply(function() {
                d.resolve();
              });
            },
            function(err) {
              $rootScope.$safeApply(function() {
                console.log('install errors', err);
                d.reject(err);
              });
            }
          );
        });
      });
    };

    /**
     * Check if we can install as a mozApp
     *
     * @param {deferred} deferred  A deferred to reject if we can't install.
     * @returns {boolean} Either a true or a false value depending on if the
     *                    browser is compatible.
     */
    this.installCompatible = function(deferred) {
      if (!window.navigator.mozApps) {
        if (deferred) {
          deferred.reject('Your browser is not compatible. Try using Firefox!');
        }
        console.log('Incompatible browser..');
        return false;
      }
      return true;
    };

    /**
     * Attempts to auto install the app without telling the user. This is
     * perhaps badly named. The reason is auto install only occurs if we are
     * already installed as an mozApp. This simply sets up the database.
     *
     * @returns {promise} A promise that will be rejected either with
     *                    'not installed', in which case this means that the app
     *                    is not already installed or it will be rejected as
     *                    an incompatible browser. It will be resolved if the
     *                    auto install went through.
     */
    this.autoInstall = function() {
      var d = $q.defer();

      if (this.installCompatible(d)) {
        var request = window.navigator.mozApps.getSelf();
        request.onsuccess = function(e) {
          if (request.result) {
            DataService.metaDbPromise.then(function(db) {
              $rootScope.$safeApply(function() {
                db.transaction('meta').objectStore('meta').get(VERSION).then(function(value) {
                  if (value === undefined || !value.installed) {
                    d.resolve();
                    console.log('We are already running as an app. Initializing the database.');
                    _initializeDatabase(d);
                  }
                });
              });
            });
          } else {
            $rootScope.$safeApply(function() {
              d.reject('not installed');
            });
          }
        };
      }
      return d.promise;
    };

    /**
     * The actuall install request.
     *
     * @returns {promise} A promise that will be resolved when the installation
     *                    is complete or rejected if there is an error.
     */
    this.install = function() {
      var d = $q.defer();

      if (this.installCompatible(d)) {
        var promise = this.autoInstall();

        promise.then(undefined, function(reason) {
          if (reason === 'not installed') {
            var install = window.navigator.mozApps.install(BASE_URL + 'manifest.webapp');
            install.onsuccess = function() {
              _initializeDatabase(d);
            };

            install.onerror = function(e) {
              $rootScope.$safeApply(function() {
                d.reject(e.target.error.name);
              });
            };
          }
        });

      }

      return d.promise;
    };

  }]);
})();