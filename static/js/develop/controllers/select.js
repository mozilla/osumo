'use strict';

(function() {
  angular.module('osumo').controller('SelectLanguageController', ['$scope', 'title', 'DataService', function($scope, title, DataService) {
    // Angular's template treats promises as if they are the resulting value as
    // it will automatically resolve them.
    $scope.locales = DataService.getAvailableLanguages();
    title('Select Language');
  }]);


  angular.module('osumo').controller('SelectProductController', ['$scope', '$route', 'title', 'DataService', function($scope, $route, title, DataService) {
    $scope.locale = $route.current.params.locale;

    DataService.getLanguageName($scope.locale).then(function(lname) {
      title(lname);
    });

    $scope.products = DataService.getAvailableProducts($scope.locale);
  }]);

  angular.module('osumo').controller('SelectTopicController', ['$scope', '$route', 'title', 'DataService', function($scope, $route, title, DataService) {
    $scope.locale = $route.current.params.locale;
    $scope.product = $route.current.params.product;
    switch($scope.product) {
      case 'firefox':
        title('Firefox');
      break;
      case 'firefox-os':
        title('Firefox OS');
      break;
      case 'mobile':
        title('Firefox on Android');
      break;
    }
    $scope.topics = DataService.getAvailableTopics($scope.locale, $scope.product);
  }]);

  angular.module('osumo').controller('SelectDocController', ['$scope', '$route', 'title', 'DataService', function($scope, $route, title, DataService) {
    $scope.locale = $route.current.params.locale;
    $scope.product = $route.current.params.product;
    $scope.topic = DataService.getTopicExpanded($scope.locale, $scope.product, $route.current.params.topic);
    $scope.topic.then(function(topic) {
      title(topic.name);
    });
  }]);
})();