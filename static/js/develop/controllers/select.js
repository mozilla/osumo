'use strict';

(function() {
  angular.module('osumo').controller('SelectLanguageController', ['$scope', 'DataService', function($scope, DataService) {
    // Angular's template treats promises as if they are the resulting value as
    // it will automatically resolve them.
    $scope.locales = DataService.getAvailableLanguages();
  }]);


  angular.module('osumo').controller('SelectProductController', ['$scope', '$route', 'DataService', function($scope, $route, DataService) {
    $scope.locale = $route.current.params.locale;
    $scope.products = DataService.getAvailableProducts($scope.locale);
  }]);

  angular.module('osumo').controller('SelectTopicController', ['$scope', '$route', 'DataService', function($scope, $route, DataService) {
    $scope.locale = $route.current.params.locale;
    $scope.product = $route.current.params.product;
    $scope.topics = DataService.getAvailableTopics($scope.locale, $scope.product);
  }]);

  angular.module('osumo').controller('SelectDocController', ['$scope', '$route', 'DataService', function($scope, $route, DataService) {
    $scope.locale = $route.current.params.locale;
    $scope.product = $route.current.params.product;
    $scope.topic = DataService.getTopicExpanded($route.current.params.topic);
  }]);
})();