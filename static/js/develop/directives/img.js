'use strict';

(function() {
  angular.module('osumo').directive('img', ['$rootScope', 'DataService', function($rootScope, DataService) {
    return {
      restrict: 'E',
      priority: 10,
      link: function(scope, element, attrs) {
        var originalSrc = attrs.originalSrc.replace('//support.cdn.mozilla.net/', '');
        DataService.hasImage(originalSrc).then(
          function(imageData) {
            // in database
            element.attr('src', imageData);
          },
          function() {
            // not in database

            // We guess to see if it is an inline image or a block image.
            // We observe that the block image do not have surrounding texts
            var prev = element[0].previousSibling;
            var next = element[0].nextSibling;

            var prevCheckedout, nextCheckedout;
            if (prev === null && next === null) {
              prevCheckedout = true;
              nextCheckedout = true;
            } else {
              while (prev !== null && prev.nodeName === "#text" && prev.textContent.trim().length === 0) {
                prev = prev.previousSibling;
              }

              while (next !== null && next.nodeName === "#text" && next.textContent.trim().length === 0) {
                next = next.nextSibling;
              }

              prevCheckedout = prev === null ? true : prev.nodeName.toLowerCase() !== '#text';
              nextCheckedout = next === null ? true : next.nodeName.toLowerCase() !== '#text';
            }

            if ((prevCheckedout && nextCheckedout) || element.parent().text().trim().length === 0) {
              // block
              element.attr('src', '/static/img/placeholder-large.png');
            } else {
              // inline
              element.attr('src', '/static/img/placeholder-small.png');
            }

            element.addClass('placeholder-img');
            // Since we are child of the viewer, it is its parent that we are
            // concerned about (the docviewer controller)
            scope.images[originalSrc] = element;

            element.bind('click', function(e) {
              $rootScope.$safeApply(function() {
                DataService.getImage(originalSrc).then(function(imageData) {
                  element.attr('src', imageData);
                  element.removeClass('placeholder-img');
                  element.unbind('click');

                  $rootScope.$safeApply(function() {
                    delete scope.images[originalSrc];
                  });
                });
              });
            });
          }
        );
      }
    };
  }]);
})();