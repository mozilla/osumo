'use strict';

(function(){

  /**
   * Copyright (c) 2013, Michael Bostock
   * All rights reserved.
   *
   * The bisect code comes from d3.js
   */
  var bisect = (function(f) {
    return function(a, x, lo, hi) {
      if (arguments.length < 3) lo = 0;
      if (arguments.length < 4) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (x < f.call(a, a[mid], mid)) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    };
  })(function(d) { return d });

  var STORES = ['locales', 'docs', 'topics', 'indexes'];


  angular.module('osumo').service('DataService', ['$rootScope', '$q', '$http', 'DBVERSION', 'angularIndexedDb', function($rootScope, $q, $http, DBVERSION, angularIndexedDb) {

    var self = this;
    var topicKey = function(locale, productSlug, topicSlug) {
      return locale + '~' + productSlug + '~' + topicSlug;
    };

    var docKey = function(locale, docSlug) {
      return locale + '~' + docSlug;
    };

    /**
     * Setups DataService. This mainly goes and open databases if required and
     * install some basic attributes. This function is at the top as it is
     * immediately called.
     */
    this.setup = function() {
      this.settingsDb = angularIndexedDb.open('osumo-settings', 1, function(db) {
        db.createObjectStore('meta', {keyPath: 'version'});
        db.createObjectStore('locales', {keyPath: 'locale'});
      });

      this.mainDb = angularIndexedDb.open('osumo', DBVERSION, function(db) {
        var stores = {};
        for (var i in STORES) {
          stores[STORES[i]] = db.createObjectStore(STORES[i], {keyPath: 'key'});
        }

        db.createObjectStore('images');

        stores.topics.createIndex('by_product', 'product');
        stores.docs.createIndex('by_id', 'id');
      });
    };

    this.setup();

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
        url: window.SUMO_URL + 'offline/get-bundles',
        method: 'GET',
        params: {products: product, locales: locale},
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

        if (objectStoreName === 'locales') {
          for (var i=0; i<l; i++) {
            // Currently there is no way to tell if something went wrong.
            (function(i){
              store.get(data[i].key).then(
                function(result) {
                  var dataToStore;
                  if (result === undefined) { // does not exist
                    dataToStore = data[i];
                  } else { // exists, merge products
                    dataToStore = result;
                    result.products = result.products.concat(data[i].products);
                  }
                  store.put(dataToStore);
                }
              );
            })(i);
          }
        } else {
          for (var i=0; i<l; i++) {
            store.put(data[i]);
          }
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
              bundles.push({id: result.value.key + "~" + product.slug, locale: result.value.key, product: product.slug, name: product.name + ' (' + result.value.name + ')'});
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
     * Gets the language name
     */
    this.getLanguageName = function(locale) {
      var deferred = $q.defer();

      this.mainDb.then(function(db) {
        var store = db.transaction('locales').objectStore('locales');
        store.get(locale).then(function(result) {
          if (result) {
            deferred.resolve(result.name);
          } else {
            deferred.reject();
          }
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
     * @param {String} locale  The locale to get the topics.
     * @param {String} product  The product slug
     * @returns {promise} A promise with a list of topics that has key as the
     *                    topic id and the name as the topic name.
     */
    this.getAvailableTopics = function(locale, product) {
      var deferred = $q.defer();

      this.mainDb.then(function(db) {
        var store = db.transaction('locales').objectStore('locales');
        store.get(locale).then(function(localeDoc) {
          var index = db.transaction('topics').objectStore('topics').index('by_product');
          var topics = [];
          index.openCursor(IDBKeyRange.only(product)).then(
            function(topic) {
              if (!topic) {
                $rootScope.$safeApply(function() {
                  deferred.resolve(topics);
                });
                return;
              }
              if (topicKey(locale, product, topic.value.slug) === topic.value.key && localeDoc.children.indexOf(topic.value.slug) >= 0 && (topic.value.children.length > 0 || topic.value.docs.length > 0)) {
                topics.push({key: topic.value.key, name: topic.value.name, slug: topic.value.slug, product: product});
              }
              topic.continue();
            }
          );
        });
      });

      return deferred.promise;
    };

    /**
     * Get a topic based on a key. This does not expand the topic (populate
     * subtopic and docs)
     *
     * @param {String} product  The product slug
     * @param {String} topic  The topic slug.
     * @returns {promise} A promise with the topic document when resolved.
     *                    Rejects if none is present.
     */
    this.getTopic = function(locale, product, topic) {
      var deferred = $q.defer();
      this.mainDb.then(function(db) {
        var store = db.transaction('topics').objectStore('topics');
        store.get(topicKey(locale, product, topic)).then(
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
    this.getTopicExpanded = function(locale, product, topic) {
      var deferred = $q.defer();

      var self = this;
      this.mainDb.then(function(db) {
        self.getTopic(locale, product, topic).then(
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
              d = topicsStore.get(topicKey(locale, product, result.children[i]));
              deferreds.push(d);

              d.then(function(value) {
                if (value !== undefined) {
                  expandedChildren.push({name: value.name, slug: value.slug});
                }
              });
            }
            for (var i=0; i<docsLength; i++) {
              d = docsStore.get(docKey(locale, result.docs[i]))
              deferreds.push(d);
              d.then(function(doc) {
                if (doc !== undefined && !doc.archived) {
                  expandedDocs.push({name: doc.title, slug: doc.slug});
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
     * @param {String} locale  the locale
     * @param {String} doc_slug  The document slug.
     * @returns {promise} A promise with the document
     */
    this.getDoc = function(locale, doc_slug) {
      var deferred = $q.defer();

      this.mainDb.then(function(db) {
        var store = db.transaction('docs').objectStore('docs');
        store.get(docKey(locale, doc_slug)).then(
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

    /**
     * Gets a document via its id. For search
     */
    this.getDocById = function(id) {
      var deferred = $q.defer();

      this.mainDb.then(function(db) {
        var store = db.transaction('docs').objectStore('docs');
        var index = store.index('by_id');
        index.get(id).then(function(doc) {
          deferred.resolve(doc);
        });
      });

      return deferred.promise;
    };


    /**
     * Gets an index.
     */
    this.search = function(queryTerms, bundlekey) {
      var deferred = $q.defer();

      var start = new Date().getTime();
      var absoluteStart = start;

      this.mainDb.then(function(db) {
        var store = db.transaction('indexes').objectStore('indexes');
        store.get(bundlekey).then(function(result) {

          console.log("Got search index: " + (new Date().getTime() - start) + "ms");
          start = new Date().getTime();
          var si = result.index;
          var potentialDocs = {};
          var docs, s;
          for (var i=0, l=queryTerms.length; i<l; i++) {
            docs = si[queryTerms[i]] || [];
            for (var j=0, ll=docs.length; j<ll; j++)
              potentialDocs[docs[j][0]] = (potentialDocs[docs[j][0]] || 0) + docs[j][1];
          }

          var strength = []
          var results = [];
          var insPoint;
          for (var docId in potentialDocs) {
            insPoint = bisect(strength, potentialDocs[docId]);
            results.splice(insPoint, 0, self.getDocById(parseInt(docId)));
            strength.splice(insPoint, 0, potentialDocs[docId]);
          }


          results = results.reverse();

          console.log("Processed search: " + (new Date().getTime() - start) + "ms");
          start = new Date().getTime();

          if (results.length === 0) {
            deferred.resolve([]);
          } else {
            $q.all(results).then(function(result) {
              console.log("Got all documents: " + (new Date().getTime() - start) + "ms");
              deferred.resolve(result);
            });
          }

        });
      });

      deferred.promise.then(function() {
        console.log("search took: " + (new Date().getTime() - absoluteStart) + "ms");
      });
      return deferred.promise;
    };

    /**
     * Checks if an image exists in the db
     *
     * @param {string} url to the image
     */
    this.hasImage = function(url) {
      var deferred = $q.defer();

      this.mainDb.then(function(db) {
        var store = db.transaction('images').objectStore('images');
        store.get(url).then(function(imageData) {
          if (imageData === undefined) {
            deferred.reject();
          } else {
            deferred.resolve(imageData);
          }
        })
      });

      return deferred.promise;
    };

    this.getImage = function(url) {
      var deferred = $q.defer();


      this.mainDb.then(function(db) {
        var store = db.transaction('images').objectStore('images');
        store.get(url).then(function(imageData) {
          if (imageData === undefined) {
            $http({
              url: '/images',
              method: 'GET',
              params: {url: url}
            }).success(function(data) {
              var store = db.transaction('images', 'readwrite').objectStore('images');
              store.put(data, url);
              deferred.resolve(data);
            }).error(function(data, status, headers, config) {
              deferred.reject(data);
            });
          } else {
            deferred.resolve(imageData);
          }
        });
      });

      return deferred.promise;
    };

  }]);
})();
