'use strict';

(function() {
  angular.module('osumo').directive('for', ['PlatformService', function(PlatformService) {

    var EPSILON = 0.000001;

    var extractBrowserVersion = function(symbol) {
      var browser, version;
      // Potential dragons ahead. Shouldn't be that bad.
      // Basically we loop through until we find a valid browser
      // identifier and then we get the version. Since we don't have
      // any browser identifers that is the first part of another, this
      // will work.
      browser = '';
      for (var j=0; j<symbol.length; j++) {
        browser += symbol[j];
        if (PlatformService.isBrowser(browser)) {
          version = parseFloat(symbol.substring(j+1));
          if (version - 35 < EPSILON) version = 3.5
          break;
        }
      }

      return {browser: browser, version: version};
    };

    var processForData = function(forData) {
      forData = forData.split(',');

      var foundOS = false, foundBrowser = false;
      var oses = {};
      var browsers = [];
      var symbol, browserData;

      for (var i=0, l=forData.length; i<l; i++) {
        if (PlatformService.isOS(forData[i])) {
          oses[forData[i]] = true;
        } else if (PlatformService.isBrowser(forData[i])) {
          symbol = forData[i];
          if (symbol.substring(0, 1) === '=') {
            symbol = symbol.substring(1);
            browserData = extractBrowserVersion(symbol);
            browserData.comparator = '=';
          } else { // We assume it is >=
            browserData = extractBrowserVersion(symbol);
            browserData.comparator = '>=';
          }
          // Special case: fx3 and fx35 act like =fx3 and =fx35.
          if (symbol === 'fx3' || symbol === 'fx35') {
            browserData.comparator = '=';
          }

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
            return Math.abs(condition.version - version) < EPSILON;
          case '>=':
            return version - condition.version > -EPSILON;
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
          show(element);
        } else {
          hide(element);
        }
      }
    };
  }]);
})();