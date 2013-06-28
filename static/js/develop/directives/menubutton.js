'use strict';

(function() {
  angular.module('osumo').directive('menubutton', function() {

    return {
      restrict: "A",
      link: function(scope, element, attrs) {
        element.bind('click', function() {
          var nav = document.getElementById('sidebar');
          if (document.body.className === 'ng-scope') {
            document.body.className = 'ng-scope exposed';
          } else {
            document.body.className = 'ng-scope';
          }
          if (nav.style.display === 'block') {
            setTimeout(function() { nav.style.display = ''; }, 500);
          } else {
            nav.style.display = 'block';
          }
        });
      }
    };

  });
})();