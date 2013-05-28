'use strict';

(function(){
  angular.module('osumo').service('DataFetcherService', ['angularIndexedDb', function(angularIndexedDb) {
    this.dbPromise = angularIndexedDb.open('todos', 1, function(db) {
      var todoStore = db.createObjectStore('todo', {keyPath: 'id'});
    }).then(function(db) {
      db.transaction(['todo'], 'readwrite').objectStore('todo').put({'id': 'someid', 'text': 'lol?'});
      return db;
    });
  }]);
})();