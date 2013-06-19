'use strict';

(function() {
  var module = angular.module('osumo');

  // From
  module.filter("relativeTime", function(){
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
        t = "less than a minute";
      } else if (delta < 120) {
        t = "about a minute";
      } else if (delta < 2700) {
        t = (parseInt(delta / 60)).toString() + " minutes";
      } else if (delta < 5400) {
        t = "about an hour";
      } else if (delta < 86400) {
        t = "about " + (parseInt(delta / 3600)).toString() + " hours";
      } else if (delta < 172800) {
        t = "one day";
      } else {
        t = (parseInt(delta / 86400)).toString() + " days";
      }
      if (relative_is_future) {
        return "in " + t;
      } else {
        return t + " ago";
      }
    };
  });
})();