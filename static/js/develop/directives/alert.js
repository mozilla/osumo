'use strict';

(function(){
  angular.module('osumo').directive('alert', [function() {
    return {
      restrict: 'E',
      transclude: true,
      replace: true,
      scope: {
        showclose: '&',
        type: '&',
        msgid: '&',
        toasts: '=',
        message: '&'
      },
      template: '<div class="alert-box {{ type() }}"><span ng-transclude>{{ message() }}</span><a href="" class="close" ng-show="showclose()">&times;</a></div>',
      link: function(scope, elements, attrs) {
        elements.find('a').bind('click', function(e) {
          e.preventDefault();
          var msgid = scope.msgid();
          if (msgid && scope.toasts) {
            angular.element(e.target).unbind('click');
            scope.$apply(function() {
              delete scope.toasts[msgid];
            });
          }
        });
      }
    };
  }]);
})();