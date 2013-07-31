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

  angular.module('osumo').service('DataService', ['$rootScope', '$q', '$http', '$timeout', 'VERSION', 'DBVERSION', 'angularIndexedDb', 'L10NService', function($rootScope, $q, $http, $timeout, VERSION, DBVERSION, angularIndexedDb, L10NService) {

    var self = this;
    var topicKey = function(locale, productSlug, topicSlug) {
      return locale + '~' + productSlug + '~' + topicSlug;
    };

    var docKey = function(locale, docSlug) {
      return locale + '~' + docSlug;
    };

    var bundleKey = function(locale, productSlug) {
      return locale + '~' + productSlug;
    };

    this.catastrophicFailure = null;

    /**
     * Setups DataService. This mainly goes and open databases if required and
     * install some basic attributes. This function is at the top as it is
     * immediately called.
     */
    this.setup = function() {
      this.settingsDb = angularIndexedDb.open('osumo-settings', 1, function(db) {
        var store = db.createObjectStore('meta', {keyPath: 'version'});
        store.put({
          version: VERSION,
          locale: navigator.language || 'en-US',
          lastUpdated: 0
        });
      });

      this.mainDb = angularIndexedDb.open('osumo', DBVERSION, function(db) {
        var stores = {};
        for (var i in STORES) {
          stores[STORES[i]] = db.createObjectStore(STORES[i], {keyPath: 'key'});
        }

        var imageStore = db.createObjectStore('images');
        db.createObjectStore('bundles');

        imageStore.createIndex('by_doc', 'doc');
        stores.topics.createIndex('by_product', 'product');
        stores.docs.createIndex('by_id', 'id');
      });

      var handleIndexedDbErr = function(err) {
        // This timeout here is so that we don't have a race condition where
        // app.run is not done yet and $rootScope.toast is not yet available.
        $timeout(function() {
          self.catastrophicFailure = err;
          if (err.name === "InvalidStateError") {
            // We are probably in private browsing mode.
            $rootScope.toast({
                showclose: 'false',
                type: "alert",
                message: L10NService._('It seems like you are using private browsing mode. This app does not support that mode and will not function correctly.')
            }, "private-browsing-fail");
          } else {
            $rootScope.toast({
              showclose: 'false',
              type: "alert",
              message: L10NService._('A fatal error occurred. Please try again later.')
            });
          }
        }, 0);
      };

      this.settingsDb.then(undefined, handleIndexedDbErr);
      this.mainDb.then(undefined, handleIndexedDbErr);
    };

    this.setup();

    /**
     * Gets an offline bundle from kitsune.
     *
     * @param {String} product  The product's slug (such as 'firefox').
     * @param {String} locale  The locale's code name (such as 'en-US').
     * @returns {$http}  An angular $http request.
     */
    this.getBundleFromSource = function(product, locale) {
      // Note that the url starts with en-US. It really does not matter which
      // one it starts. The GET parameters will always override it.
      return $http({
        url: window.SUMO_URL + 'offline/get-bundle',
        method: 'GET',
        params: {product: product, locale: locale}
      });
    };

    this.saveBundle = function(bundle, hash, product, locale) {
      var storeOps = [];
      for (var objectStoreName in bundle) {
        storeOps.push(this.addData(objectStoreName, bundle[objectStoreName]));
      };

      var d = $q.defer();
      this.mainDb.then(function(db) {
        var store = db.transaction('bundles', 'readwrite').objectStore('bundles');
        store.put(hash, bundleKey(locale, product)).then(function() {
          d.resolve();
        });
      });
      storeOps.push(d.promise);

      var promise = $q.all(storeOps);
      promise.then(function() {
        self.updateLastUpdateTime();
      });
      return promise;
    };

    this.checkAllUpdates = function() {
      var deferred = $q.defer();

      this.getAvailableBundles().then(function(bundles) {
        var ops = [];

        for (var i=0; i<bundles.length; i++) {
          ops.push(self.checkUpdate(bundles[i].product, bundles[i].locale));
        }

        $q.all(ops).then(function(updates) {
          var needsUpdate = false;
          var bundlesToUpdate = [];

          for (var i=0; i<updates.length; i++) {
            needsUpdate = needsUpdate || updates[i];
            if (updates[i] > 0)
              bundlesToUpdate.push(bundles[i]);
          }

          $rootScope.$broadcast('articles-update', needsUpdate, bundlesToUpdate);
          deferred.resolve(needsUpdate, bundlesToUpdate);
        });
      });

      return deferred.promise;
    };

    this.checkUpdate = function(product, locale) {
      var bkey = bundleKey(locale, product);
      var deferred = $q.defer();

      var currentVersionPromise = this.mainDb.then(function(db) {
        var store = db.transaction('bundles').objectStore('bundles');
        return store.get(bkey);
      });

      var checkRequest = $http({
        url: window.SUMO_URL + 'offline/bundle-meta',
        method: 'GET',
        params: {product: product, locale: locale}
      });

      checkRequest.success(function(data, status, headers, config) {
        currentVersionPromise.then(function(currentVersionHash) {
          console.log(data.hash, currentVersionHash, product, locale);
          deferred.resolve(data.hash.trim() !== currentVersionHash);
        });
      });

      checkRequest.error(function(data, status, headers, config) {
        if (status === 404 || status === 503) {
          // In this case the server might not have the hash yet as it is
          // not generated or redis is down. So we say that our version is okay
          deferred.resolve(false);
        }
      });

      deferred.promise.then(function() {
        self.updateLastUpdateTime();
      })

      return deferred.promise;
    };

    this.updateLastUpdateTime = function() {
      var deferred = $q.defer();

      this.settingsDb.then(function(db) {
        var store = db.transaction('meta', 'readwrite').objectStore('meta');

        store.get(VERSION).then(function(original) {
          original.lastUpdated = new Date().getTime() / 1000;
          store.put(original).then(function() {
            deferred.resolve();
          });
        });
      });

      return deferred.promise;
    };

    this.getLastCheckTime = function() {
      var deferred = $q.defer();

      this.settingsDb.then(function(db) {
        var store = db.transaction('meta', 'readwrite').objectStore('meta');

        store.get(VERSION).then(function(original) {
          if (original === undefined) {
            // Initialization not done. So we're gonna do that now.
            deferred.resolve(new Date().getTime() / 1000);
          } else {
            deferred.resolve(original.lastUpdated);
          }
        });
      });

      return deferred.promise;
    };

    /**
     * Adds data to IndexedDB.
     *
     * @param {String} objectStoreName  The name of the object store.
     * @param {Array} data  An array of objects that serves as the value for
     *                      that object store.
     */
    this.addData = function(objectStoreName, data) {
      var deferred = $q.defer();
      var l = data.length;

      this.mainDb.then(function(db) {
        var ops = [];
        var store = db.transaction(objectStoreName, 'readwrite').objectStore(objectStoreName);

        var storeOne = function(i) {
          // Store one result for locale documents as the products array
          // in the locales object needs to be merged.
          var d = $q.defer();

          store.get(data[i].key).then(function(result) {
            var dataToStore;
            if (result === undefined) { // does not exist
              dataToStore = data[i];
            } else { // Merge
              dataToStore = result;
              for (var j=0; j<data[i].products.length; j++) {
                if (result.products.indexOf(data[i].products[j]) !== -1) {
                  result.products.push(data[i].products[j]);
                }
              }
            }

            store.put(dataToStore).then(function() {
              d.resolve();
            });
          });

          return d.promise;
        };

        if (objectStoreName === 'locales') {
          // We have to do something special for locales because products needs
          // to be merged.
          for (var i=0; i<l; i++) {
            ops.push(storeOne(i));
          }
        } else {
          for (var i=0; i<l; i++) {
            ops.push(store.put(data[i]));
          }
        }

        $q.all(ops).then(function() {
          deferred.resolve();
        });
      });

      return deferred.promise;
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
            // To work around a bug in slimit.
            // https://github.com/rspivak/slimit/issues/52
            result['continue']();
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
          result['continue']();
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
    this.getAvailableTopics = function(locale, product, all) {
      all = all || false;
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

              // We need to check if the topic key agrees with the limitation
              // of the slug, product, and locale. We also make sure that the
              // topic actually has content and/or subtopics
              if (topicKey(locale, product, topic.value.slug) === topic.value.key && (topic.value.children.length > 0 || topic.value.docs.length > 0)) {
                if (all) {
                  topics.push(topic.value);
                } else {
                  topics.push({key: topic.value.key, name: topic.value.name, slug: topic.value.slug, product: product});
                }
              }
              topic['continue']();
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
          if (!result) {
            deferred.resolve([]);
          } else {
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
        store.get(url).then(function(image) {
          if (image === undefined) {
            deferred.reject();
          } else {
            deferred.resolve(image.data);
          }
        })
      });

      return deferred.promise;
    };

    this.getImage = function(url, locale, doc) {
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
              var image = {
                data: data,
                doc: docKey(locale, doc)
              };
              store.put(image, url);
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

    this.deleteBundle = function(locale, product) {
      var deferred = $q.defer();

      this.mainDb.then(function(db) {

        var allOps = [];
        var topicsDeferred = $q.defer();

        var trans = db.transaction(['indexes', 'locales', 'bundles'], 'readwrite');
        var indexesStore = trans.objectStore('indexes');
        var localesStore = trans.objectStore('locales');
        var bundlesStore = trans.objectStore('bundles');

        self.getAvailableTopics(locale, product, true).then(function(topics) {
          var trans = db.transaction(['docs', 'images', 'topics'], 'readwrite');

          var topicsStore = trans.objectStore('topics');
          var docsStore = trans.objectStore('docs');
          var imagesStore = trans.objectStore('images');
          var ops = [];
          var dkey;

          console.log('Deleting topics...');

          var imageDeferred;
          for (var i=0; i<topics.length; i++) {

            // Deleting the documents
            for (var j=0, l=topics[i].docs.length; j<l; j++) {
              dkey = docKey(locale, topics[i].docs[j]);

              ops.push(docsStore['delete'](dkey));

              imageDeferred = $q.defer();
              ops.push(imageDeferred.promise);

              (function(imageDeferred){
                imagesStore.index('by_doc').openCursor(IDBKeyRange.only(dkey)).then(function(result) {
                  if (!result) {
                    imageDeferred.resolve();
                  } else {
                    console.log('deleting image', result.primaryKey);
                    imagesStore['delete'](result.primaryKey);
                    result['continue']();
                  }
                });
              })(imageDeferred);
            }

            ops.push(topicsStore['delete'](topics[i].key));
          }


          $q.all(ops).then(function() {
            console.log("all topic ops resolved");
            topicsDeferred.resolve();
          }, function() { console.log('topicops reject') });
        });

        allOps.push(topicsDeferred.promise);


        var localeDeferred = $q.defer();
        allOps.push(localeDeferred.promise);

        localesStore.get(locale).then(function(localeDoc) {
          if (localeDoc) {
            var newProducts = [];
            for (var i=0; i<localeDoc.products.length; i++) {
              if (localeDoc.products[i].slug !== product) {
                newProducts.push(localeDoc.products[i]);
              }
            }
            localeDoc.products = newProducts;

            if (localeDoc.products.length > 0) {
              console.log('updating locale');
              localesStore.put(localeDoc).then(function() {
                localeDeferred.resolve();
                console.log('locale updated');
              });
            } else {
              console.log('deleting locale');
              localesStore['delete'](localeDoc.key).then(function() {
                localeDeferred.resolve();
                console.log('locale deleted');
              });
            }
          } else {
            deferred.reject();
          }
        });

        var bkey = bundleKey(locale, product);
        allOps.push(indexesStore['delete'](bkey));
        allOps.push(bundlesStore['delete'](bkey));

        $q.all(allOps).then(function() {
          console.log("all done?");
          deferred.resolve();
        })

      });

      return deferred.promise;
    };

  }]);
})();
