'use strict';

(function() {
  angular.module('osumo').directive('for', [function() {
    // Detect OS and browsers. Adapted from
    // https://github.com/mozilla/kitsune/blob/master/kitsune/sumo/static/js/browserdetect.js
    //
    //  - Changed the original code to be more friendly to AngularJS.
    //  - Removed dependencies we don't wanna add to our code.
    //  - Renamed a bunch of stuff to (hopefully) make more sense.

    var browser, version, OS, versionDataString;

    var BROWSERS = {m: true, fx: true};
    var OSES = {win8: true, win7: true, win: true, mac: true, android: true, fxos: true, linux: true, maemo: true, winxp: true};

    var defaultMobileBrowser = {browser: 'm', version: 21};
    var defaultDesktopBrowser = {browser: 'fx', version: 21};
    var defaultDesktop = 'win7';

    var isOS = function(os) {
      return OSES[os] === true;
    };

    var isBrowser = function(browser) {
      return BROWSERS[browser] === true;
    };

    var availableBrowsers = [
      {
        dataString: navigator.userAgent,
        subStrings: ['Fennec'],
        versionSearch: 'Fennec',
        identity: 'm'
      },
      {
        dataString: navigator.userAgent,
        subStrings: ['Mobile', 'Firefox'],
        versionSearch: 'Firefox',
        identity: 'm'
      },
      {
        dataString: navigator.userAgent,
        subStrings: ['Firefox'],
        versionSearch: 'Firefox',
        identity: 'fx'
      }
    ];

    var availableOSes = [
      {
        dataString: navigator.userAgent,
        subStrings: ['Windows NT 6.2'],
        identity: 'win8',
      },
      { // 6.0 is Vista and 6.1 is Win7. We intentially lump them together.
        dataString: navigator.userAgent,
        subStrings: [/Windows NT 6\.[01]/],
        identity: 'win7'
      },
      { // If we can't figure out version. Fallback.
        dataString: navigator.platform,
        subStrings: ['Win'],
        identity: 'win'
      },
      {
        dataString: navigator.platform,
        subStrings: ['Mac'],
        identity: 'mac'
      },
      {
        dataString: navigator.userAgent,
        subStrings: ['Android'],
        identity: 'android'
      },
      {
        dataString: navigator.userAgent,
        subStrings: ['Mobile', 'Firefox'],
        identity: 'fxos'
      },
      {
        dataString: navigator.userAgent,
        subStrings: ['Maemo'],
        identity: 'maemo'
      },
      {
        dataString: navigator.platform,
        subStrings: ['Linux'],
        identity: 'linux'
      }
    ];

    var findSomethingFrom = function(data) {
      for (var i=0, l=data.length; i<l; i++) {
        var matchedAll = true;
        var sub;

        // how does this even work O_O
        versionDataString = data[i].versionSearch || data[i].identity;

        // Check if all subStrings are in the dataString.
        for (var j=0, ll=data[i].subStrings.length; j<ll; j++) {
          sub = data[i].subStrings[j];
          if (sub instanceof RegExp)
            matchedAll = sub.exec(data[i].dataString)
          else
            matchedAll = data[i].dataString.indexOf(sub) !== -1;

          if (!matchedAll) break;
        }

        if (matchedAll) return data[i].identity;
      }
    };

    var identifyVersionVia = function(dataString) {
      var index = dataString.indexOf(versionDataString);
      if (index === -1) return;
      return parseFloat(dataString.substring(index+versionDataString.length+1));  // Turns "1.1.1" into 1.1 rather than 1.11. :-(
    };

    // I believe the call order here is very importance as findSomethingFrom
    // employs essentially what is known as global variables :(
    browser = findSomethingFrom(availableBrowsers);
    version = identifyVersionVia(navigator.userAgent) || identifyVersionVia(navigator.appVersion);
    OS = findSomethingFrom(availableOSes);


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
        if (isBrowser(browser)) {
          version = parseFloat(browser.substring(j+1));
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
        if (isOS(forData[i])) {
          oses[forData[i]] = true;
        } else if (isBrowser) {
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

      if (platformsAllowed.oses.length === 0 || (OS in platformsAllowed.oses) || (platformsAllowed.oses['win'] && OS.substring(0, 3) === 'win')) {
        osConditionMet = true;
      }

      browserConditionMet = platformsAllowed.browsers.length === 0 || meetBrowserCondition(browser, version, platformsAllowed.browsers);

      // Speciase case 1:
      // If the current selection is desktop:
      if (browser === 'fx') {
        // * Show the default mobile OS if no browser was specified or
        //   the default mobile browser was also specified.
        if ((platformsAllowed.oses.android || platformsAllowed.oses.fxos) && (platformsAllowed.browsers.length === 0 || meetBrowserCondition(defaultMobileBrowser.browser, defaultMobileBrowser.version, platformsAllowed.browsers))) {
          return true;
        }
        // * Show the default mobile browser if no OS was specified or
        //   the default mobile OS was also specified.
        if ((platformsAllowed.oses.length === 0 || platformsAllowed.oses.android || platformsAllowed.fxos) && meetBrowserCondition(defaultMobileBrowser.browser, defaultMobileBrowser.version, platformsAllowed.browsers)) {
          return true;
        }
      }

      // If the current selection is mobile:
      if (browser === 'm') {
        // * Show the default desktop OS if no browser was specified or
        //   the default desktop browser was also specified.
        if ((platformsAllowed.oses[defaultDesktop] || platformsAllowed.oses.win) && (platformsAllowed.browsers.length === 0 || meetBrowserCondition(defaultDesktopBrowser.browser, defaultDesktopBrowser.version, platformsAllowed.browsers))) {
          return true;
        }
        // * Show the default desktop browser if no OS was specified or
        //   the default desktop OS was also specified.
        if ((platformsAllowed.oses.length === 0 || platformsAllowed.oses[defaultDesktop] || platformsAllowed.oses.win) && meetBrowserCondition(defaultDesktopBrowser.browser, defaultDesktopBrowser.version, platformsAllowed.browsers)) {
          return true;
        }
      }

      return browserConditionMet && osConditionMet;
    };

    // Angular.element does not have hide/show
    var hideImage = function(element) {
      // element.html(element.html() + " <strong>Hidden</strong> ");
      console.log("hiding " + element.attr("data-for"));
      element.css('display', 'none');
    };

    var showImage = function(element) {
      // element.html(element.html() + " <strong>Shown</strong> ");
      console.log("show " + element.attr("data-for"));
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

        if (shouldShow(platforms, browser, version, OS)) {
          show(element);
        } else {
          hide(element);
        }
      }
    };
  }]);
})();