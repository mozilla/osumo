'use strict';

describe('sending toasts to their controller', function() {

  var ToastsController, scope;

  beforeEach(module('osumo'));

  beforeEach(inject(function($rootScope, $controller){
    scope = $rootScope.$new();
    ToastsController = $controller('ToastsController', {$scope: scope});
  }));

  it('should have an empty toasts list', function() {
    expect(Object.keys(scope.toasts).length).toBe(0);
  });

  it('should listen to toast broadcast', function() {
    scope.$broadcast('toast', {message: 'A toast', showclose: true}, 'someid');

    expect(Object.keys(scope.toasts).length).toBe(1);
    expect(scope.toasts['someid'].message).toBe('A toast');
    expect(scope.toasts['someid'].showclose).toBe(true);
  });

  it('should generate id and set showclose', function() {
    scope.$broadcast('toast', {message: 'A toast'});

    expect(Object.keys(scope.toasts).length).toBe(1);

    console.log(scope.toasts);
    for (var key in scope.toasts) {
      expect(scope.toasts[key].message).toBe('A toast');
      expect(scope.toasts[key].showclose).toBe(true);
    }
  });
});