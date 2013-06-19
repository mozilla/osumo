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

    console.log("Browser", browser);
    console.log("Version", version);
    console.log("OS", OS);
    console.log("Platform", navigator.platform);
    console.log("Useragent", navigator.userAgent)

    return {
      restrict: 'C',
      controller: function() {

      },
      link: function(scope, element, attrs) {
        element.attr('style', 'background-color: #888;');
      }
    };
  }]);
})();

/*
 *Disabled until futhur notice.
 *
'use strict';

(function() {
  angular.module('osumo').directive('for', [function() {

//     * Detect operating systems and browsers. Adapted from
//     * https://github.com/mozilla/kitsune/blob/master/kitsune/sumo/static/js/browserdetect.js
//     *
//     *  - Changed the original code to be more friendly to AngularJS.
 //    *  - Removed dependencies we don't wanna add to our code.
  //   *  - Renamed a bunch of stuff to (hopefully) make more sense.
    var browser, version, OS, versionDataString;

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

    // Show for stuff starts here~


    var extractForPlatforms = function(dataFor) {
      var platforms = dataFor.split(',');
      var browsers = [];
      var notBrowsers = [];
      var oses = [];
      var notOses = [];
      var current, platform, b, o, version;
      for (var i=0, l=platforms.length; i<l; i++) {
        platform = platforms[i].trim().toLowerCase(); // We should have zeptos at least.
        current = platform;
        if (platform.indexOf('not ') === 0) {
          platform = platform.substring(4);
          current = platform;
          b = notBrowsers;
          o = notOses;
        } else {
          b = browsers;
          o = oses;
        }

        if (current[0] === '=')
          current = current.substring(1);

        if (current.indexOf('fx') === 0 || (current.indexOf('ma') !== 0 && current.indexOf('m') === 0)) {
          // This better be a browser!
          // And.. gross
          if (current.indexOf('fx') === 0) {
            version = current.substring(2);
            if (version === '35') { // Legacy..
              version = '3.5';
            }
            version = parseFloat(version);
            if (platform[0] === '=')
              b.push(['=fx', version]);
            else
              b.push(['fx', version]);
          } else if (current.indexOf('m') === 0) {
            version = parseFloat(current.substring(1));
            if (platform[0] === '=')
              b.push(['=m', version]);
            else
              b.push(['m', version]);

          }
        } else {
          o.push(platform); // This better be an OS >_>
        }
      }
      return {
        browsers: browsers,
        notBrowsers: notBrowsers,
        oses: oses,
        notOses: notOses
      };
    };

    var shouldHide = function(browser, version, os, platforms) {
      var osConditionMet = false;
      var browserConditionMet = false;
      var canShow = false;

      // Let's detect some oses!
      if (os.indexOf('win') === 0 && platforms.oses.indexOf('win') !== -1) {
        osConditionMet = true;
      }

      if (platforms.oses.indexOf(os) !== -1) {
        osConditionMet = true;
      }

      if (platforms.oses.length === 0) {
        osConditionMet = true;
      }

      if (os.indexOf('win') === 0 && platforms.notOses.indexOf('win') !== -1) {
        osConditionMet = false;
      }

      if (platforms.notOses.indexOf(os) !== -1) {
        osConditionMet = false;
      }


      // Let's detect some browsers!!
      var b, v;
      for (var i=0, l=platforms.browsers.length; i<l; i++) {
        b = platforms.browsers[i][0];
        v = platforms.browsers[i][1];
        if (b.indexOf('=') === 0) {
          b = b.substring(1);
          if (browser === b && version === v) {
            browserConditionMet = true;
            break;
          }
        } else {
          if (browser === b && version >= v) {
            browserConditionMet = true;
            break;
          }
        }
      }

      if (platforms.browsers.length === 0) {
        browserConditionMet = true;
      }

      for (var i=0, l=platforms.notBrowsers.length; i<l; i++) {
        b = platforms.notBrowsers[i][0];
        v = platforms.notBrowsers[i][1];
        if (b.indexOf('=') === 0) {
          b = b.substring(1);
          if (browser === b && version === v) {
            browserConditionMet = false;
            break;
          }
        } else {
          if (browser === b && version >= v) {
            browserConditionMet = false;
            break;
          }
        }
      }

      canShow = browserConditionMet && osConditionMet;
      // TODO: special cases
      return canShow;
    };

    return {
      restrict: 'C',
      link: function(scope, element, attrs) {
        element.attr('style', 'background-color: #888;');
        if (shouldHide(browser, version, OS, extractForPlatforms(element.attr('data-for')))) {
          element.remove();
        }
      }
    };
  }]);
})();
*/
