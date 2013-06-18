'use strict';

(function() {
  angular.module('osumo').directive('img', ['$rootScope', 'DataService', function($rootScope, DataService) {
    return {
      restrict: 'E',
      priority: 10,
      link: function(scope, element, attrs) {
        element = $(element[0]); // Convert to a zepto element
        var originalSrc = attrs.originalSrc.replace('//support.cdn.mozilla.net/', '');
        DataService.hasImage(originalSrc).then(
          function(imageData) {
            // in database
            element.attr('src', imageData);
          },
          function() {
            // not in database

            // We guess to see if it is an inline image or a block image.
            // We observe that the block image is either separated by <br> or
            // it does not have any surrounding text.
            var prev = element.prev();
            var next = element.next();

            // TODO: we might detect a false positive block when we have a text
            // node before the next() or after the prev().

            // We also sometimes observe that the image is at the start or the
            // end of something, which means that the prev[0] or next[0] will
            // be undefined. However, if both are undefined, we need to check
            // if there are other text..
            var prevCheckedout, nextCheckedout;
            if (prev[0] === undefined && next[0] === undefined) {
              prevCheckedout = false;
              nextCheckedout = false;
            } else {
              prevCheckedout = prev[0] === undefined ? true : prev[0].nodeName.toLowerCase() === 'br';
              nextCheckedout = next[0] === undefined ? true : next[0].nodeName.toLowerCase() === 'br';
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