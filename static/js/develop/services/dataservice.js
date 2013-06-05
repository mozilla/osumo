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
        var stores = {};
        for (var i in STORES) {
          stores[STORES[i]] = db.createObjectStore(STORES[i], {keyPath: 'key'});
        }

        stores.topics.createIndex('by_product', 'product');
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

        var l = data.length;
        for (var i=0; i<l; i++) {
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

    /**
     * Gets a list of available languages.
     *
     * @returns {promise} A promise that has a list with an object with the attr
     *                    id as the locale id and name as the name.
     */
    this.getAvailableLanguages = function() {
      var deferred = $q.defer();
      this.mainDb.then(function(db) {
        var store = db.transaction('locales', 'readwrite').objectStore('locales');
        var cursor = store.openCursor(IDBKeyRange.lowerBound(0));

        var locales = [];
        cursor.then(function(result) {
          if (!result) {
            $rootScope.$safeApply(function() {
              deferred.resolve(locales);
            });
            return;
          }

          locales.push({id: result.value.key, name: result.value.name});
          result.continue();
        });
      });
      return deferred.promise;
    };

    /**
     * Gets a list of available products given a locale
     *
     * @param {String} locale  The locale id
     * @returns {promise} A promise that has a list with an object with the attr
     *                    slug as the product slug and name as the product name.
     */
    this.getAvailableProducts = function(locale) {
      var deferred = $q.defer();

      this.mainDb.then(function(db) {
        var store = db.transaction('locales').objectStore('locales');
        store.get(locale).then(
          function(result) {
            $rootScope.$safeApply(function() {
              deferred.resolve(result.products);
            });
          },
          function(err) {
            deferred.reject(err);
          }
        );
      });

      return deferred.promise;
    };

    /**
     * Get a list of available topics given a locale and a product.
     *
     * @param {String} locale  The locale id
     * @param {String} product  The product slug
     * @returns {promise} A promise with a list of topics that has key as the
     *                    topic id and the name as the topic name.
     */
    this.getAvailableTopics = function(locale, product) {
      var deferred = $q.defer();

      this.mainDb.then(function(db) {
        var store = db.transaction('topics').objectStore('topics');
        var index = store.index('by_product');
        var topics = [];
        index.openCursor(IDBKeyRange.lowerBound(0)).then(
          function(result) {
            if (!result) {
              $rootScope.$safeApply(function() {
                deferred.resolve(topics);
              });
              return;
            }
            topics.push({key: result.value.key, name: result.value.name})
            result.continue();
          }
        );
      });

      return deferred.promise;
    };

    /**
     * Get a topic based on a key. This does not expand the topic (populate
     * subtopic and docs)
     *
     * @param {integer} topic  The topic key.
     * @returns {promise} A promise with the topic document when resolved.
     *                    Rejects if none is present.
     */
    this.getTopic = function(topic) {
      topic = parseInt(topic);
      var deferred = $q.defer();

      this.mainDb.then(function(db) {
        var store = db.transaction('topics').objectStore('topics');
        store.get(topic).then(
          function(result) {
            if (result === undefined) { // No record found
              deferred.reject();
            }
            deferred.resolve(result);
          },
          function(err) {
            deferred.reject(err);
          }
        );
      });

      return deferred.promise;
    };


    /**
     * Gets a topic but also expand it
     */
    this.getTopicExpanded = function(topic) {
      var deferred = $q.defer();

      var self = this;
      this.mainDb.then(function(db) {
        self.getTopic(topic).then(
          function(result) {
            var topicsStore = db.transaction('topics').objectStore('topics');
            // TODO: investigate to see if it is possible to use .transaction(['topics', 'docs'])
            var docsStore = db.transaction('docs').objectStore('docs');

            var subtopicsLength = result.children.length;
            var docsLength = result.docs.length;

            var expandedChildren = [];
            var expandedDocs = [];

            var deferreds = [];

            var d;

            for (var i=0; i<subtopicsLength; i++) {
              d = topicsStore.get(result.children[i]);
              deferreds.push(d);

              d.then(function(value) {
                if (value !== undefined) {
                  expandedChildren.push({key: value.key, name: value.name});
                }
              });
            }

            for (var i=0; i<docsLength; i++) {
              d = docsStore.get(result.docs[i])
              deferreds.push(d);
              d.then(function(doc) {
                if (doc !== undefined) {
                  expandedDocs.push({key: doc.key, name: doc.title, slug: doc.slug});
                }
              });
            }

            $q.all(deferreds).then(function() {
              result.children = expandedChildren;
              result.docs = expandedDocs;
              deferred.resolve(result);
            });
          },
          function(err) {

          }
        );
      });

      return deferred.promise;
    };

    /**
     * Gets a document/article from indexeddb
     *
     * @param {integer} docid  The document id.
     * @returns {promise} A promise with the document
     */
    this.getDoc = function(docid) {
      docid = parseInt(docid);
      var deferred = $q.defer();

      this.mainDb.then(function(db) {
        var store = db.transaction('docs').objectStore('docs');
        store.get(docid).then(
          function(doc) {
            deferred.resolve(doc);
          },
          function(err) {
            deferred.reject(err);
          }
        );

      });

      return deferred.promise;
    };

  }]);
})();
