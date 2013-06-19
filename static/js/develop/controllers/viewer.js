'use strict';

(function() {
  angular.module('osumo').controller('DocViewer', ['$scope', '$route', '$location', 'title', 'DataService', function($scope, $route, $location, title, DataService) {

    $scope.locale = $route.current.params.locale;
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
      scope.$watch(
        function(scope) {
          var doc = scope.$eval(attrs.doc);
          if (!doc)
            return ""

          if (doc.archived)
            return "<p>The content you're looking for is archived and not included here.</p>"

          return doc.html;
        },
        function(value) {
          element.html(value);
          $compile(element.contents())(scope);
          setTimeout(function() {
            $anchorScroll();
          }, 0);
        }
      );
    };

  }]);
})();