'use strict';

(function() {

var app = angular.module('osumo', ['angularIndexedDb']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $routeProvider.when('/', {
    templateUrl: '/static/partials/loading.html',
    controller: 'HomeController'
  });

  $routeProvider.when('/install', {
    templateUrl: '/static/partials/install.html',
    controller: 'InstallController'
  });

  $routeProvider.when('/kb', {
    templateUrl: '/static/partials/select_language.html',
    controller: 'SelectLanguageController'
  });

  $routeProvider.when('/:locale/products', {
    templateUrl: '/static/partials/select_product.html',
    controller: 'SelectProductController'
  });

  $routeProvider.when('/:locale/products/:product', {
    templateUrl: '/static/partials/select_topic.html',
    controller: 'SelectTopicController'
  });

  $routeProvider.when('/:locale/products/:product/:topic', {
    templateUrl: '/static/partials/select_doc.html',
    controller: 'SelectDocController'
  });

  $routeProvider.when('/:locale/kb/:doc', {
    templateUrl: '/static/partials/doc.html',
    controller: 'DocViewer'
  });

  $routeProvider.when('/settings', {
    templateUrl: '/static/partials/settings.html',
    controller: 'SettingsViewController'
  });

  // Search needs to have a bar on the top of the page when pressed.
  // TODO: This is blocked until we migrate to firefox os like ui
  $routeProvider.when('/search', {
    templateUrl: '/static/partials/search.html',
    controller: 'SearchController'
  });

  var notFoundPage = {
    templateUrl: '/static/partials/404.html',
    controller: 'NotFoundController'
  };

  $routeProvider.when('/:locale/404', notFoundPage);
  $routeProvider.otherwise(notFoundPage);

}]);

app.factory('title', ['$window', 'LocaleService', function($window, LocaleService){
  return function(title) {
    $window.document.title = title + ' - ' + LocaleService.getTranslation('Offline Mozilla Support');
  };
}]);

app.constant('VERSION', 1);
app.constant('DBVERSION', 1);

app.run(['$rootScope', '$location', '$anchorScroll', 'AppService', function($rootScope, $location, $anchorScroll, AppService) {
  $rootScope.toast = function(toast, id) {
    $rootScope.$broadcast('toast', toast, id);
  };

  $rootScope.untoast = function(id) {
    $rootScope.$broadcast('untoast', id);
  };

  // From https://coderwall.com/p/ngisma
  $rootScope.$safeApply = function(fn) {
    var phase = this.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      if (fn) {
        fn();
      }
    } else {
      this.$apply(fn);
    };
  };

  $rootScope.appNeedsUpgrade = AppService.checkAppcacheUpgrade();

  $rootScope.upgradeApp = function() {
    location.reload();
  };

}]);

})();