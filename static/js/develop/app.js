'use strict';

(function() {

var app = angular.module('osumo', ['angularIndexedDb', 'angular_l10n']);

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

app.factory('title', ['$window', 'L10NService', function($window, L10NService){
  return function(title) {
    $window.document.title = title + ' - ' + L10NService._('Offline Mozilla Support');
    document.getElementById("app-title").innerHTML = title;
  };
}]);

app.constant('VERSION', 1);
app.constant('DBVERSION', 1);

// The reason that this exists is because ng-options puts the numeric index
// from the array as the value. In search, we want the value to be the bundle
// key. This means that we cannot use ng-options and must use ng-repeat.
// However, there is no way to make sure if something is selected or not.
// This is to compensate for that. ngx-select="expression"
// ngx is for ng extras
app.directive('ngxSelected', function() {
  return {
    restrict: 'A',
    priority: -10,
    link: function(scope, element, attrs) {
      if (scope.$eval(attrs.ngxSelected)) {
        element.attr('selected', 'selected');
      } else {
        element.removeAttr('selected');
      }
    }
  }
});

app.run(['$rootScope', '$location', 'AppService', 'DataService', 'L10NService', function($rootScope, $location, AppService, DataService, L10NService) {
  // Toasting stuff is fun! Though we need butter here at the Mozilla MV office
  $rootScope.toast = function(toast) {
    $rootScope.$broadcast('toast', toast);
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

  // Upgrading stuff.
  $rootScope.appNeedsUpgrade = AppService.checkAppcacheUpgrade();

  $rootScope.upgradeApp = function() {
    location.reload();
  };

  // Now we setup listening for navigator.onLine.
  // A few words of caution: navigator.onLine only tells you if you're
  // connected to a network. This is to say, if navigator.onLine is true, you
  // could still be offline as you could be connected to a wireless network
  // without an actual connection to the series of tubes.

  $rootScope.online = navigator.onLine;

  // TODO: Since these could run anytime, could we encounter bugs like
  // http://stackoverflow.com/questions/17309488/angularjs-initial-route-controller-not-loaded-subsequent-ones-are-fine
  document.addEventListener('online', function() {
    $rootScope.$safeApply(function() {
      $rootScope.online = true;
    });
  });

  document.addEventListener('offline', function() {
    $rootScope.$safeApply(function() {
      $rootScope.online = false;
    });
  });

}]);

})();