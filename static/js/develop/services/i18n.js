'use strict';

(function() {
  angular.module('osumo').service('LocaleService', ['$rootScope', '$q', '$http', 'DataService', 'VERSION', function($rootScope, $q, $http, DataService, VERSION) {

    this.defaultLocale = 'en-US';
    this.currentLocale = {
      locale: this.defaultLocale,
      data: {}
    };

    var self = this;

    DataService.settingsDb.then(function(db) {
      var store = db.transaction('meta').objectStore('meta');
      store.get(VERSION).then(function(result) {
        if (result !== undefined) {
          self.defaultLocale = result.locale;
          self.setLocale(self.defaultLocale);
        }
      })
    });

    this._setupCalled = 0;
    this.setup = function(db) {
      self._setupCalled++;
      console.log(self._setupCalled);
      var metaStore = db.transaction('meta').objectStore('meta');
      metaStore.get(VERSION).then(function(result) {
        if (result === undefined) {
          if (self._setupCalled < 5) {
            setTimeout(function() { self.setup(db); }, 1000); // Try again in a second.
          } else {
            console.log("giving up, using " + self.defaultLocale);
            self.getOrAddLocale(self.defaultLocale);
          }
        } else {
          self.defaultLocale = result.locale;
          self.currentLocale = result.locale;
          self.getOrAddLocale(result.locale);
        }
      });
    };


    this.updateLocale = function(locale) {
      var deferred = $q.defer();

      DataService.settingsDb.then(function(db) {
        $http.get('/i18n/' + locale).success(function(data) {
          var localeStore = db.transaction('locales', 'readwrite').objectStore('locales');
          localeStore.put(data);
          deferred.resolve(data);
        }).error(function() {
          deferred.reject(arguments);
        });
      });

      return deferred.promise;
    };


    this.setLocale = function(locale) {
      var deferred = $q.defer();

      if (this.currentLocale.locale === locale) {
        deferred.resolve()
      } else {
        DataService.settingsDb.then(function(db) {
          var localeStore = db.transaction('locales').objectStore('locales');
          localeStore.get(locale).then(function(result) {
            if (result === undefined) {
              deferred.reject()
            } else {
              self.currentLocale = result;
              deferred.resolve()
              $rootScope.$broadcast('locale-changed', locale);
            }
          });
        });
      }

      return deferred.promise;
    };

    this.setDefaultLocale = function(locale) {
      var deferred = $q.defer();

      var updatePromise = this.updateLocale(locale);
      DataService.settingsDb.then(function(db) {
        var metaStore = db.transaction('meta', 'readwrite').objectStore('meta');
        metaStore.put({version: VERSION, locale: locale}).then(function() {
          self.defaultLocale = locale;
          updatePromise.then(function() {
            self.setLocale(locale);
            deferred.resolve();
          }, function() { deferred.reject(); });
        });
      });

      return deferred.promise;
    };

    this.getDownloadedLocales = function() {
      var deferred = $q.defer();

      DataService.settingsDb.then(function(db) {
        var localeStore = db.transaction('locales').objectStore('locales');
        var cursor = localeStore.openCursor(IDBKeyRange.lowerBound(0));
        var locales = [];

        cursor.then(function(result) {
          if (!result) {
            $rootScope.$safeApply(function() {
              locales.push({id: 'en-US', name: 'English'});
              deferred.resolve(locales);
            });
            return;
          }

          if (result.value.locale != 'en-US')
            locales.push({id: result.value.locale, name: result.value.name});
          result.continue();
        });
      });

      return deferred.promise;
    };

    this.getTranslation = function(s, locale) {
      return this.currentLocale.data[s] || s;
    };

  }]);

  // Correct way of using this should be {{ "Some thing" | i18n }}
  angular.module('osumo').directive('i18n', ['$rootScope', '$q', 'LocaleService', function($rootScope, $q, LocaleService) {
    var cleanup;
    return {
      restrict: 'EAC',
      compile: function(element, attrs) {
        var originalText = element.text();
        element.text(LocaleService.getTranslation(originalText, attrs.locale));
        cleanup = $rootScope.$on('locale-changed', function(locale) {
          // attrs will always override?
          element.text(LocaleService.getTranslation(originalText, attrs.locale || locale));
        });
      },
      link: function(scope) {
        scope.$on('$destroy', function() {
          console.log("destroy");
          cleanup();
        });
      }
    };
  }]);
})();
