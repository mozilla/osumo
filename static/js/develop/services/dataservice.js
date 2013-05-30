'use strict';

(function(){
  angular.module('osumo').service('DataService', ['VERSION', 'angularIndexedDb', function(VERSION, angularIndexedDb) {

    var that = this;
    this.setup = function() {
      // metaDB always have a version of 1.
      that.metaDbPromise = angularIndexedDb.open('osumo-settings', 1, function(db) {
        var store = db.createObjectStore('meta', {keyPath: 'version'});
        store.put({version: VERSION, installed: false, dbsDownloaded: []});
      });
      return that.metaDbPromise;
    };

    this.setup();

  }]);
})();