'use strict';

describe('backend data services', function() {
  var dataService;

  beforeEach(module('osumo'));

  beforeEach(inject(function(DataService) {
    dataService = DataService;
  }));

  it('should open meta database', function() {
    expect(dataService.metaDbPromise).not.toEqual(false);
  });
});