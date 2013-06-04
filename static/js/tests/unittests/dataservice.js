'use strict';

describe('backend data services', function() {
  var dataService, version, indexedDb, rootScope;

  beforeEach(module('osumo'));

  beforeEach(inject(function(VERSION, angularIndexedDb, DataService, $rootScope) {
    version = VERSION;
    dataService = DataService;
    indexedDb = angularIndexedDb;
    rootScope = $rootScope;
  }));

  var setupDb = function() {
    var done = false;

    runs(function() {
      dataService.settingsDb.then(function(db) {
        db.close();
        indexedDb.deleteDatabase('osumo-settings').then(function(r) {
          dataService.setup();
          dataService.settingsDb.then(function(db) {
            done = true;
            return db;
          });
        });
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