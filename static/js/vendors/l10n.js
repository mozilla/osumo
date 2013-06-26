"use strict";

(function() {
  var module = angular.module("angular_l10n", []);

  module.service("L10NService", ["$rootScope", function($rootScope) {
    this.DEFAULT_LOCALE = 'en-US';
    this.prevLocale = this.DEFAULT_LOCALE;
    this.currentLocale = this.DEFAULT_LOCALE;

    /**
     * Sets a locale and fires the locale change event. This essentially
     * changes the locale.
     * Call this at a sane time or calle $apply on your own. This might be
     * dengerous, however.
     */
    this.setLocale = function(locale) {
      if (!(locale in window.localeStrings)) {
        throw "Locale " + locale + " not in localeStrings"
      }
      this.currentLocale = locale;
      this.prevLocale = locale;
      $rootScope.$broadcast("locale-changed", locale);
    };

    this.setLocaleTemp = function(locale) {
      this.prevLocale = this.currentLocale;
      this.currentLocale = locale;
    };

    this.revertLocale = function() {
      this.currentLocale = this.prevLocale;
    };

    // Use this method when you're translating variables.
    this.translate = function(txt) {
      return window.localeStrings[this.currentLocale][txt] || txt;
    };

    // Use this when you're translating a string literal.
    this._ = this.translate;
  }]);

  /*
  // You should really never ever use this unless there is a damn good
  // reason. Filters are called too often. That means the performance of the
  // app will be really really bad.
  // Disabled for now.
  module.filter("l10nf", ["L10NService", function() {
    return function(txt) {
      return L10NService.translate(txt);
    };
  }]);
  */

  module.directive("l10n", ["$compile", "$rootScope", "L10NService", function($compile, $rootScope, L10NService) {
    var cleanup;

    return {
      restrict: "EAC",
      link: function(scope, element, attrs) {
        var original = element.text();
        var doTranslation = function() {
          element.text(L10NService.translate(original));
          // This way expanded variables in templates works as usual.
          // TODO: investigate potential memory leak.
          // ^ This means don't have a directive that allocates memory like
          //   hook up to events when you have a translated string!
          $compile(element.contents())(scope);
        };

        doTranslation();
        cleanup = $rootScope.$on("locale-changed", doTranslation);
        scope.$on("$destroy", cleanup);
      }
    };
  }]);

})();