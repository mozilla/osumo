'use strict';

(function() {
  angular.module('osumo').controller('SelectLanguageController', ['$scope', 'title', 'DataService', 'L10NService', function($scope, title, DataService, L10NService) {
    // Angular's template treats promises as if they are the resulting value as
    // it will automatically resolve them.
    setSearchParams();
    L10NService.reset();
    $scope.locales = DataService.getAvailableLanguages();
    title(L10NService._('Languages'));
  }]);


  angular.module('osumo').controller('SelectProductController', ['$scope', '$route', 'title', 'DataService', 'L10NService', function($scope, $route, title, DataService, L10NService) {
    $scope.locale = $route.current.params.locale;
    setSearchParams($scope.locale);
    L10NService.setLocale($scope.locale);
    title(L10NService._('Products'))
    $scope.products = DataService.getAvailableProducts($scope.locale);
  }]);

  angular.module('osumo').controller('SelectTopicController', ['$scope', '$route', 'title', 'DataService', 'L10NService', function($scope, $route, title, DataService, L10NService) {
    $scope.locale = $route.current.params.locale;
    L10NService.setLocale($scope.locale);
    $scope.product = $route.current.params.product;
    switch($scope.product) {
      case 'firefox':
        title(L10NService._('Firefox'));
      break;
      case 'firefox-os':
        title(L10NService._('Firefox OS'));
      break;
      case 'mobile':
        title(L10NService._('Firefox on Android'));
      break;
    }
    setSearchParams($scope.locale, $scope.product);
    $scope.topics = DataService.getAvailableTopics($scope.locale, $scope.product);
  }]);

  angular.module('osumo').controller('SelectDocController', ['$scope', '$route', 'title', 'DataService', 'L10NService', function($scope, $route, title, DataService, L10NService) {
    $scope.locale = $route.current.params.locale;
    $scope.product = $route.current.params.product;

    setSearchParams($scope.locale, $scope.product);

    L10NService.setLocale($scope.locale);
    $scope.topic = DataService.getTopicExpanded($scope.locale, $scope.product, $route.current.params.topic);
    $scope.topic.then(function(topic) {
      title(topic.name);
    });
  }]);
})();