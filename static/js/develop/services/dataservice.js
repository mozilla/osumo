'use strict';

(function(){

  var STORES = ['locales', 'docs', 'topics'];

  angular.module('osumo').service('DataService', ['$rootScope', '$q', '$http', 'DBVERSION', 'angularIndexedDb', function($rootScope, $q, $http, DBVERSION, angularIndexedDb) {

    /**
     * Setups DataService. This mainly goes and open databases if required and
     * install some basic attributes. This function is at the top as it is
     * immediately called.
     */
    this.setup = function() {
      this.settingsDb = angularIndexedDb.open('osumo-settings', 1, function(db) {
        db.createObjectStore('meta', {keyPath: 'version'});
      });

      this.mainDb = angularIndexedDb.open('osumo', DBVERSION, function(db) {
        for (var i in STORES) {
          db.createObjectStore(STORES[i], {keyPath: 'keys'});
        }
      });
    };

    this.setup();

    /**
     * Gets all the languages available from kitsune.
     *
     * @returns {$http}  An angular $http request.
     */
    this.getLanguages = function() {
      return $http({
        url: window.SUMO_URL + 'en-US/kb/offline/get-languages',
        method: 'GET'
      });
    };

    /**
     * Gets an offline bundle from kitsune.
     *
     * @param {String} product  The product's slug (such as 'firefox').
     * @param {String} locale  The locale's code name (such as 'en-US').
     * @returns {$http}  An angular $http request.
     * s
     */
    this.getBundleFromSource = function(product, locale) {
      // Note that the url starts with en-US. It really does not matter which
      // one it starts. The GET parameters will always override it.
      return $http({
        url: window.SUMO_URL + 'en-US/kb/offline/get-bundles',
        method: 'GET',
        params: {products: product, locales: locale}
      });
    };

    /**
     * Adds data to IndexedDB. Note that this function does not give you
     * any feedback over whether or not the operation is successful. We'll
     * see if this is needed in the future.
     *
     * @param {String} objectStoreName  The name of the object store.
     * @param {Array} data  An array of objects that serves as the value for
     *                      that object store.
     */
    this.addData = function(objectStoreName, data) {
      this.mainDb.then(function(db) {
        var store = db.transaction(objectStoreName, 'readwrite').objectStore(objectStoreName);

        for (var i in data) {
          store.put(data[i]);
        }
      });
    };

    /**
     * Gets a list of all downloaded bundles.
     *
     * @returns {promise}  A promise that when resolved will have an array of
     *                     objects with a product, locale, and name field.
     */
    this.getAvailableBundles = function() {
      var deferred = $q.defer();

      this.mainDb.then(
        function(db) {
          var store = db.transaction('locales', 'readwrite').objectStore('locales');

          // This gets everything in the store.
          var cursor = store.openCursor(IDBKeyRange.lowerBound(0));
          var bundles = [];
          cursor.then(function(result) {
            if (!result) {
              $rootScope.$safeApply(function() {
                deferred.resolve(bundles);
              });
              return;
            }

            var product;
            for (var i in result.value.products) {
              product = result.value.products[i];
              bundles.push({locale: result.value.key, product: product.slug, name: product.name + ' (' + result.value.name + ')'});
            }
            result.continue();
          });
        }
      );

      return deferred.promise;
    };

  }]);
})();