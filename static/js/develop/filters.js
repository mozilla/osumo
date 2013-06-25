'use strict';

(function() {
  var module = angular.module('osumo');

  // From
  module.filter("relativeTime", ['L10NService', function(L10NService){
    // Python side uses seconds as timestamp. So we take seconds.
    // From https://gist.github.com/shuhaowu/3994233 with modifications.
    return function(timestamp, relative_to) {
      if (timestamp === null || timestamp === undefined)
        return "";

      var delta, relative_is_future, t;

      if (!relative_to)
        relative_to = parseInt(new Date().getTime() / 1000);

      if (typeof timestamp !== "number")
        timestamp = timestamp.getTime() / 1000;

      delta = timestamp - relative_to;
      relative_is_future = delta > 0 ? true : false;
      delta = Math.abs(delta);
      if (delta < 60) {
        t = L10NService._("less than a minute");
      } else if (delta < 120) {
        t = L10NService._("about a minute");
      } else if (delta < 2700) {
        t = (parseInt(delta / 60)).toString() + L10NService._(" minutes");
      } else if (delta < 5400) {
        t = L10NService._("about an hour");
      } else if (delta < 86400) {
        t = L10NService._("about ") + (parseInt(delta / 3600)).toString() + L10NService._(" hours");
      } else if (delta < 172800) {
        t = L10NService._("one day");
      } else {
        t = (parseInt(delta / 86400)).toString() + L10NService._(" days");
      }
      if (relative_is_future) {
        return L10NService._("in ") + t;
      } else {
        return t + L10NService._(" ago");
      }
    };
  }]);
})();