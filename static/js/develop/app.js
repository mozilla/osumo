'use strict';

(function() {

var app = angular.module('osumo', ['angularIndexedDb', 'angular_l10n']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $routeProvider.when('/install', {
    templateUrl: '/static/partials/install.html',
    controller: 'InstallController'
  });

  $routeProvider.when('/', {
    controller: 'HomeController',
    template: '<progress class="center"></progress>'
  });

  $routeProvider.when('/languages', {
    controller: 'SelectLanguageController',
    templateUrl: '/static/partials/select_language.html'
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

  $routeProvider.when('/about', {
    templateUrl: '/static/partials/about.html',
    controller: 'AboutController'
  });

  $routeProvider.when('/legal', {
    templateUrl: '/static/partials/legal.html',
    controller: 'LegalController'
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
  return function(title, doNotTranslate) {
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

app.run(['$rootScope', '$location', '$q', 'AppService', 'DataService', 'L10NService', function($rootScope, $location, $q, AppService, DataService, L10NService) {
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

  DataService.getLastCheckTime().then(function(lastUpdateTime) {
    if (new Date().getTime() / 1000 - lastUpdateTime > 604800) {
      DataService.checkAllUpdates();
    }
  });

  $rootScope.$on('articles-update', function(e, needsUpdate, bundlesToUpdate) {
    $rootScope.needsUpdate = needsUpdate;
    $rootScope.bundlesToUpdate = bundlesToUpdate;
    console.log(needsUpdate, bundlesToUpdate);
  });

  $rootScope.updateArticles = function() {
    $rootScope.needsUpdate = false;
    var ops = [];
    var d, product, locale;
    for (var i=0; i<$rootScope.bundlesToUpdate.length; i++) {
      $rootScope.toast({message: L10NService._('Updating articles...'), showclose: false});
      d = $q.defer();
      (function(d){
        product = $rootScope.bundlesToUpdate[i].product;
        locale = $rootScope.bundlesToUpdate[i].locale;
        DataService.getBundleFromSource(product, locale).success(function(data, status, headers) {
          DataService.saveBundle(data, headers('X-Content-Hash'), product, locale).then(function() {
            d.resolve();
          });
        }).error(function(data, status, headers) {
          d.reject(status);
          console.log("update failed", status);
        });
      })(d);
      ops.push(d.promise);
    }

    $q.all(ops).then(
      function() {
        $rootScope.bundlesToUpdate = [];
        $rootScope.toast({message: L10NService._('Articles are all updated!')});
      },
      function() {
        $rootScope.toast({message: L10NService._('Update failed. Please try again later.')});
      }
    );
  };

}]);

})();