'use strict';

describe('backend data services', function() {
  var dataService, version, indexedDb, rootScope, httpBackend;

  beforeEach(module('osumo'));

  beforeEach(inject(function(VERSION, angularIndexedDb, DataService, $rootScope, _$httpBackend_) {
    version = VERSION;
    dataService = DataService;
    indexedDb = angularIndexedDb;
    rootScope = $rootScope;
    httpBackend = _$httpBackend_;
  }));

  var setupDb = function() {
    var done = false;

    runs(function() {
      dataService.setup();

      dataService.settingsDb.then(function(db) {
        db.transaction('meta', 'readwrite').objectStore('meta').openCursor(IDBKeyRange.lowerBound(0)).then(
          function(result) {
            if (!result) {
              done = true;
              return;
            }
            result.delete().onsuccess = function() {
              result.continue();
            };
          }
        );
      });
      rootScope.$apply();
    });

    waitsFor(function() { return done; });
  };

  beforeEach(setupDb);

  it('should open meta database', function() {
    expect(dataService.settingsDb).not.toEqual(false);

    var done = false;

    runs(function() {
      dataService.settingsDb.then(function(db) {
        expect(db).toBeTruthy();
        done = true;
        return db;
      });
      rootScope.$apply();
    });

    waitsFor(function() { return done; });
  });

});