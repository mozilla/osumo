'use strict';

(function(){

angular.module('osumo').controller('HomeController', ['$scope', 'title', 'DataFetcherService', function($scope, title, DataFetcherService) {
  title('Home');
  $scope.todo = 'No Value';
  DataFetcherService.dbPromise.then(function(db) {
    db.transaction(['todo']).objectStore('todo').get('someid').then(function(value) {
      $scope.todo = value;
      $scope.$$phase || $scope.$apply;
      return db;
    });
  });
}]);

})();