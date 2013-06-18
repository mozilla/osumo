'use strict';

(function() {
  angular.module('osumo').controller('SelectLanguageController', ['$scope', 'title', 'DataService', 'LocaleService', function($scope, title, DataService, LocaleService) {
    // Angular's template treats promises as if they are the resulting value as
    // it will automatically resolve them.
    $scope.locales = DataService.getAvailableLanguages();
    title(LocaleService.getTranslation('Select Language'));
  }]);


  angular.module('osumo').controller('SelectProductController', ['$scope', '$route', 'title', 'DataService', 'LocaleService', function($scope, $route, title, DataService, LocaleService) {
    $scope.locale = $route.current.params.locale;

    DataService.getLanguageName($scope.locale).then(function(lname) {
      title(lname);
    });

    LocaleService.setLocale($scope.locale);

    $scope.products = DataService.getAvailableProducts($scope.locale);
  }]);

  angular.module('osumo').controller('SelectTopicController', ['$scope', '$route', 'title', 'DataService', 'LocaleService', function($scope, $route, title, DataService, LocaleService) {
    $scope.locale = $route.current.params.locale;
    LocaleService.setLocale($scope.locale);
    $scope.product = $route.current.params.product;
    switch($scope.product) {
      case 'firefox':
        title(LocaleService._('Firefox'));
      break;
      case 'firefox-os':
        title(LocaleService._('Firefox OS'));
      break;
      case 'mobile':
        title(LocaleService._('Firefox on Android'));
      break;
    }
    $scope.topics = DataService.getAvailableTopics($scope.locale, $scope.product);
  }]);

  angular.module('osumo').controller('SelectDocController', ['$scope', '$route', 'title', 'DataService', 'LocaleService', function($scope, $route, title, DataService, LocaleService) {
    $scope.locale = $route.current.params.locale;
    $scope.product = $route.current.params.product;
    LocaleService.setLocale($scope.locale);
    $scope.topic = DataService.getTopicExpanded($scope.locale, $scope.product, $route.current.params.topic);
    $scope.topic.then(function(topic) {
      title(topic.name);
    });
  }]);
})();