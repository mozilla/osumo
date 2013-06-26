'use strict';

(function() {
  angular.module('osumo').directive('a', ['$anchorScroll', 'L10NService', function($anchorScroll, L10NService) {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
        var href = element.attr('href');
        var cleanup = function() {
          element.unbind('click');
        };

        if (!href || href.length === 0 || href[0] === '#') {
          element.bind('click', function(event) {
            if (href[0] === '#') {
              $anchorScroll();
            }
            event.preventDefault();
          });
        }

        if (href.indexOf('http') === 0) {
          element.bind('click', function(event) {
            if (!navigator.onLine) {
              scope.$apply(function() {
                scope.toast({
                  message: L10NService._('It looks like you are offline! This link will take you to an external website which requires an internet connection.'),
                  type: 'alert'
                });
              });
              event.preventDefault();
            }
          });

          element.attr("target", "_blank");
        }

        scope.$on('$destroy', cleanup);
      }
    };
  }]);
})();