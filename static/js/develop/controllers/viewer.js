'use strict';

(function() {
  angular.module('osumo').controller('DocViewer', ['$scope', '$route', '$location', 'title', 'DataService', 'L10NService', function($scope, $route, $location, title, DataService, L10NService) {

    $scope.locale = $route.current.params.locale;
    L10NService.setLocale($scope.locale);
    $scope.doc = DataService.getDoc($scope.locale, $route.current.params.doc);
    $scope.doc.then(function(doc) {
      if (doc === undefined) {
        $location.path('/' + $scope.locale + '/404');
        $location.replace();
        return;
      };

      title(doc.title);
    });
    $scope.images = {};

    $scope.numOfUnloadedImages = function() {
      return Object.keys($scope.images).length;
    };

    $scope.allImagesLoaded = function() {
      for (var url in $scope.images) {
        if ($scope.images[url]) {
          return false;
        }
      }
      return true;
    };

    $scope.loadAllImages = function() {
      for (var url in $scope.images) {
        $scope.images[url].triggerHandler('click');
      }
    };
  }]);

  angular.module('osumo').directive('viewer', ['$compile', '$anchorScroll', function($compile, $anchorScroll) {

    return function(scope, element, attrs) {
      var currentScope;

      scope.$watch(
        function(scope) {
          var doc = scope.$eval(attrs.doc);
          if (!doc)
            return ""

          if (doc.archived)
            return "__archived__";

          return doc.html;
        },
        function(value) {
          if (value) {
            // We need to capture the currentScope so we can properly remove it
            // Otherwise we won't be able to destroy the i18n directives (which)
            // all binds to a locale-change event so they can switch locales.
            currentScope = scope.$new();
            if (value !== "__archived__") {
              element.html(value);
              $compile(element.contents())(currentScope);
              setTimeout(function() {
                $anchorScroll();
              }, 0);
            }
          } else if (currentScope) {
            // This point the value is none, so we can destroy.
            // Regular ng-view already does that for us. Here we just need to
            // do it manually.
            element.contents().remove()
            currentScope.$destroy();
            currentScope = null;
          }
        }
      );
    };

  }]);
})();