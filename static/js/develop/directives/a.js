'use strict';

(function() {
  angular.module('osumo').directive('a', ['$anchorScroll', function($anchorScroll) {
    return {
      restrict: 'E',
      compile: function(element, attrs) {
        element.bind('click', function(event) {
          var href = element.attr('href');
          if (!href || href.length === 0 || href[0] === '#') {
            if (href[0] === '#') {
              console.log("Anchor, eh?");
              $anchorScroll();
            }
            event.preventDefault();
          }
        });
      }
    };
  }]);
})();