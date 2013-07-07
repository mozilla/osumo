'use strict';

(function(){
  var module = angular.module('osumo');

  module.controller('HomeController', ['$scope', '$location', 'DataService', 'L10NService', function($scope, $location, DataService, L10NService) {

    DataService.getAvailableBundles().then(function(bundles) {
      var url;
      if (bundles.length === 0) {
        url = '/install';
      } else if (bundles.length === 1) {
        url = '/' + bundles[0].locale + '/products/' + bundles[0].product;
      } else {
        var products = [];
        var locales = [];

        for (var i=0; i<bundles.length; i++) {
          products.push(bundles[i].product);
          locales.push(bundles[i].locale);
        }

        if (products.length === 1 && locales.indexOf(L10NService.defaultLocale) !== -1) {
          url = '/' + L10NService.defaultLocale + '/products/' + products[0];
        } else if (locales.length === 1) {
          url = '/' + locales[0] + '/products';
        } else if (locales.indexOf(L10NService.defaultLocale) !== -1) {
          url = '/' + L10NService.defaultLocale + '/products';
        } else {
          url = '/install';
        }
      }

      $location.path(url);
      $location.replace();
    });

  }]);

  module.controller('SelectLanguageController', ['$scope', '$location', 'L10NService', 'AppService', 'DataService', function($scope, $location, L10NService, AppService, DataService) {
    L10NService.reset();
    $scope.languages = DataService.getAvailableLanguages();

    $scope.save = function(locale) {
      AppService.setDefaultLocale(locale).then(function() {
        var url = '/' + locale + '/products';
        $location.path(url);
      });
    };
  }]);

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


  module.controller('NotFoundController', ['$scope', 'title', 'L10NService', function($scope, title, L10NService) {
    title(L10NService._('Page Not Found'));
  }]);

  module.controller('AboutController', ['$scope', 'title', 'L10NService', function($scope, title, L10NService) {
    title(L10NService._('About'));
    $scope.commitSha = window.COMMIT_SHA;
    $scope.appcacheHash = window.APPCACHE_HASH;
  }]);

  module.controller('LegalController', ['$scope', 'title', 'L10NService', function($scope, title, L10NService) {
    title(L10NService._('Legal Information'));
  }]);
})();