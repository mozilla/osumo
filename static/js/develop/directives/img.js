'use strict';

(function() {
  angular.module('osumo').directive('img', ['$rootScope', 'DataService', function($rootScope, DataService) {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
        var originalSrc = attrs.originalSrc.replace('//support.cdn.mozilla.net/', '');
        DataService.hasImage(originalSrc).then(
          function(imageData) {
            // in database
            element.attr('src', imageData);
          },
          function() {
            // not in database
            element.attr('src', '/static/img/placeholder.png');
            element.addClass('placeholder-img');

            element.bind('click', function(e) {
              $rootScope.$safeApply(function() {
                DataService.getImage(originalSrc).then(function(imageData) {
                  element.attr('src', imageData);
                  element.removeClass('placeholder-img');
                  element.unbind('click');
                });
              });
            });
          }
        );
      }
    };
  }]);
})();