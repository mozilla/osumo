'use strict';

(function(){

angular.module('osumo').controller('HomeController', ['$scope', 'title', function($scope, title) {
  title('Home');
}]);

})();