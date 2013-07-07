'use strict';

(function() {
  angular.module('osumo').directive('img', ['$rootScope', '$timeout', '$route', 'DataService', 'L10NService', function($rootScope, $timeout, $route, DataService, L10NService) {
    var visible = function(element) {
      return element.offsetWidth > 0 || element.offsetHeight > 0;
    };
    return {
      restrict: 'E',
      priority: 10,
      link: function(scope, element, attrs) {
        if ('notDirective' in attrs)
          return
        // Set timeout 0 is required as we need to wait for the directive 'for'
        // to apply before this. If 'for' determines to hide the image, this
        // will not execute.
        $timeout(function() {
          if (!visible(element[0])) {
            return;
          }
          var originalSrc = attrs.originalSrc.replace('//support.cdn.mozilla.net/', '');
          DataService.hasImage(originalSrc).then(
            function(imageData) {
              // in database
              element.attr('src', imageData);
            },
            function() {
              // not in database

              var cleanup = function() {
                element.unbind('click');
              };

              // We guess to see if it is an inline image or a block image.
              // We observe that the block image do not have surrounding texts.
              // Unless the block image is by itself in a table (?). So we also
              // check to see if we are contained in a td. We check only 3
              // levels back as it seems any further it is likely something
              // weird and we should just use normal checking procedure. If we
              // are in a table.. we probably will be an inline image?
              // See: en-US/kb/customize-navigation-buttons-back-home-bookmarks.
              // (1 level back: only td and image, 2 levels back: td, span.for,
              //  img, 3 levels...????)
              var prev = element[0].previousSibling;
              var next = element[0].nextSibling;

              var prevCheckedout, nextCheckedout;
              if (prev === null && next === null) {
                prevCheckedout = true;
                nextCheckedout = true;
              } else {
                while (prev !== null && prev.nodeName === '#text' && prev.textContent.trim().length === 0) {
                  prev = prev.previousSibling;
                }

                while (next !== null && next.nodeName === '#text' && next.textContent.trim().length === 0) {
                  next = next.nextSibling;
                }

                prevCheckedout = prev === null ? true : prev.nodeName.toLowerCase() !== '#text';
                nextCheckedout = next === null ? true : next.nodeName.toLowerCase() !== '#text';
              }

              var j = 3;
              var parent = element, inTable = false;
              while (j >= 0) {
                parent = parent.parent();
                if (parent[0].nodeName.toLowerCase() === 'td') {
                  j = -1;
                  inTable = true;
                } else {
                  j--;
                }
              }

              if (!inTable && ((prevCheckedout && nextCheckedout) || element.parent().text().trim().length === 0)) {
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

                if (navigator.onLine) {
                  $rootScope.$safeApply(function() {
                    DataService.getImage(originalSrc, $route.current.params.locale, $route.current.params.doc).then(function(imageData) {
                      element.attr('src', imageData);
                      element.removeClass('placeholder-img');
                      element.unbind('click');

                      $rootScope.$safeApply(function() {
                        delete scope.images[originalSrc];
                      });
                    });
                  });
                } else {
                  $rootScope.$safeApply(function() {
                    $rootScope.toast({message: L10NService._('A data connection is needed for downloading images.'), type: 'alert'}, 'image-download-requires-network')
                  });
                }
              });

              scope.$on('$destroy', cleanup);
            }
          );
        }, 0);
      }
    };
  }]);
})();