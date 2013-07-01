'use strict';

(function(){
  var module = angular.module('osumo');

  module.controller('SelectProductController', ['$scope', '$route', 'title', 'DataService', 'L10NService', function($scope, $route, title, DataService, L10NService) {
    $scope.locale = $route.current.params.locale;
    setSearchParams($scope.locale);
    L10NService.setLocale($scope.locale);
    title(L10NService._('Products'))
    $scope.products = DataService.getAvailableProducts($scope.locale);
  }]);

  module.controller('SelectTopicController', ['$scope', '$route', 'title', 'DataService', 'L10NService', function($scope, $route, title, DataService, L10NService) {
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

  module.controller('SelectDocController', ['$scope', '$route', 'title', 'DataService', 'L10NService', function($scope, $route, title, DataService, L10NService) {
    $scope.locale = $route.current.params.locale;
    $scope.product = $route.current.params.product;

    setSearchParams($scope.locale, $scope.product);

    L10NService.setLocale($scope.locale);
    $scope.topic = DataService.getTopicExpanded($scope.locale, $scope.product, $route.current.params.topic);
    $scope.topic.then(function(topic) {
      title(topic.name);
    });
  }]);


  module.controller('SettingsViewController', ['$scope', 'title', 'AppService', 'L10NService', function($scope, title, AppService, L10NService) {
    $scope.locale = L10NService.defaultLocale;
    $scope.languages = window.LANGUAGES;

    L10NService.reset();
    title(L10NService._('Settings'));

    $scope.save = function() {
      AppService.setDefaultLocale($scope.locale).then(function() {
        $scope.toast({message: L10NService._("Saved."), autoclose: 1500});
      });
    };
  }]);

  module.controller('NotFoundController', ['$scope', 'title', 'L10NService', function($scope, title, L10NService) {
    // Do not reset locale on this page!
    title(L10NService._('Page Not Found'));
  }]);

  module.controller('AboutController', ['$scope', 'title', 'L10NService', function($scope, title, L10NService) {
    title(L10NService._('About'));
  }]);
})();