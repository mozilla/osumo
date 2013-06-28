'use strict';

(function() {
  angular.module('osumo').service("PlatformService", [function() {
    // Detect OS and browsers. Adapted from
    // https://github.com/mozilla/kitsune/blob/master/kitsune/sumo/static/js/browserdetect.js
    //
    //  - Changed the original code to be more friendly to AngularJS.
    //  - Removed dependencies we don't wanna add to our code.
    //  - Renamed a bunch of stuff to (hopefully) make more sense.

    var versionDataString;

    var BROWSERS = {m: true, fx: true};
    var OSES = {win8: true, win7: true, win: true, mac: true, android: true, fxos: true, linux: true, maemo: true, winxp: true};

    this.defaultMobileBrowser = {browser: 'm', version: 22};
    this.defaultDesktopBrowser = {browser: 'fx', version: 22};
    this.defaultDesktop = 'win7';

    this.isOS = function(os) {
      return OSES[os] === true;
    };

    this.isBrowser = function(browser) {
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
        subStrings: ['Maemo'],
        identity: 'maemo'
      },
      {
        dataString: navigator.platform,
        subStrings: ['Linux'],
        identity: 'linux'
      },
      {
        dataString: navigator.userAgent,
        subStrings: ['Mobile', 'Firefox'],
        identity: 'fxos'
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
    this.browser = findSomethingFrom(availableBrowsers);
    this.version = identifyVersionVia(navigator.userAgent) || identifyVersionVia(navigator.appVersion);
    this.OS = findSomethingFrom(availableOSes);
  }]);
})();
