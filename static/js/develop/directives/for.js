'use strict';

(function() {
  angular.module('osumo').directive('for', ['PlatformService', function(PlatformService) {

    var EPSILON = 0.000001;

    var processForData = function(forData) {
      forData = forData.split(',');

      var foundOS = false, foundBrowser = false;
      var oses = {};
      var browsers = [];
      var symbol, browserData, match;

      for (var i=0, l=forData.length; i<l; i++) {
        if (PlatformService.isOS(forData[i])) {
          oses[forData[i]] = true;
        } else if (match = PlatformService.isBrowser(forData[i])) {
          browserData = {
            comparator: match[1].length === 0 ? '>=' : '=',
            browser: match[2],
            maxVersion: match[3]
          };

          // Special case: fx3 and fx35 act like =fx3 and =fx35.
          if (browserData.maxVersion === '35') {
            browserData.maxVersion = 3;
            browserData.minVersion = 3.5;
            browserData.comparator = '=';
          } else if (browserData.maxVersion === '3') {
            browserData.maxVersion = 2.5;
            browserData.minVersion = 3;
            browserData.comparator = '=';
          } else {
            browserData.maxVersion = parseInt(browserData.maxVersion);
            browserData.minVersion = browserData.maxVersion;
          }

          browserData.maxVersion += (1 - EPSILON);

          browsers.push(browserData);
        }
      }
      return {oses: oses, browsers: browsers};
    };

    var meetBrowserCondition = function(browser, version, conditions) {
      var condition;
      for (var i=0; i<conditions.length; i++) {
        condition = conditions[i];
        switch (condition.comparator) {
          case '=':
            return condition.minVersion <= version && version <= condition.maxVersion;
          case '>=':
            return version - condition.minVersion > -EPSILON;
        }
      }
      return false;
    };

    var shouldShow = function(platformsAllowed, browser, version, OS) {
      var osConditionMet = false;
      var browserConditionMet = false;

      if (Object.keys(platformsAllowed.oses).length === 0 || (OS in platformsAllowed.oses) || (platformsAllowed.oses['win'] && OS.substring(0, 3) === 'win')) {
        osConditionMet = true;
      }

      browserConditionMet = platformsAllowed.browsers.length === 0 || meetBrowserCondition(browser, version, platformsAllowed.browsers);

      // Speciase case 1:
      // If the current selection is desktop:
      if (browser === 'fx') {
        // * Show the default mobile OS if no browser was specified or
        //   the default mobile browser was also specified.
        if ((platformsAllowed.oses.android || platformsAllowed.oses.fxos) && (platformsAllowed.browsers.length === 0 || meetBrowserCondition(PlatformService.defaultMobileBrowser.browser, PlatformService.defaultMobileBrowser.version, platformsAllowed.browsers))) {
          return true;
        }
        // * Show the default mobile browser if no OS was specified or
        //   the default mobile OS was also specified.
        if ((Object.keys(platformsAllowed.oses).length === 0 || platformsAllowed.oses.android || platformsAllowed.fxos) && meetBrowserCondition(PlatformService.defaultMobileBrowser.browser, PlatformService.defaultMobileBrowser.version, platformsAllowed.browsers)) {
          return true;
        }
      }

      // If the current selection is mobile:
      if (browser === 'm') {
        // * Show the default desktop OS if no browser was specified or
        //   the default desktop browser was also specified.
        if ((platformsAllowed.oses[defaultDesktop] || platformsAllowed.oses.win) && (platformsAllowed.browsers.length === 0 || meetBrowserCondition(PlatformService.defaultDesktopBrowser.browser, PlatformService.defaultDesktopBrowser.version, platformsAllowed.browsers))) {
          return true;
        }
        // * Show the default desktop browser if no OS was specified or
        //   the default desktop OS was also specified.
        if ((Object.keys(platformsAllowed.oses).length === 0 || platformsAllowed.oses[defaultDesktop] || platformsAllowed.oses.win) && meetBrowserCondition(PlatformService.defaultDesktopBrowser.browser, PlatformService.defaultDesktopBrowser.version, platformsAllowed.browsers)) {
          return true;
        }
      }

      return browserConditionMet && osConditionMet;
    };

    // Angular.element does not have hide/show
    var hideImage = function(element) {
      // element.html(element.html() + " <strong>Hidden</strong> ");
      // console.log("hiding " + element.attr("data-for"));
      element.css('display', 'none');
    };

    var showImage = function(element) {
      // element.html(element.html() + " <strong>Shown</strong> ");
      // console.log("show " + element.attr("data-for"));
      element.removeAttr('style');
    };

    return {
      restrict: 'C',
      priority: 100,
      controller: ['$scope', function($scope) {

      }],
      link: function(scope, element, attrs) {
        var forData = element.attr('data-for');
        if (!forData)
          return;

        // Catch the "not" operator if it is there. Strip it off of the forData
        // as well
        var isInverted = forData.substring(0, 4) === 'not ';
        if (isInverted)
          forData = forData.substring(4);

        var platforms = processForData(forData);

        var hide = isInverted ? showImage : hideImage;
        var show = isInverted ? hideImage : showImage;
        if (shouldShow(platforms, PlatformService.browser, PlatformService.version, PlatformService.OS)) {
          // console.log(forData, platforms, isInverted ? 'hide' : 'show');
          show(element);
        } else {
          // console.log(forData, platforms, isInverted ? 'show' : 'hide');
          hide(element);
        }
      }
    };
  }]);
})();