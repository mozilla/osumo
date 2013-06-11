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
      if (doc.redirect) {
        $location.path(doc.redirect);
        $location.replace();
      }
    });
  }]);

  angular.module('osumo').directive('viewer', ['$compile', function($compile) {

    return function(scope, element, attrs) {
      scope.$watch(
        function(scope) {
          return scope.$eval(attrs.html);
        },
        function(value) {
          element.html(value);
          $compile(element.contents())(scope);
        }
      );
    };

  }]);
})();