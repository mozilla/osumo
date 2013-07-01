"use strict";

(function() {
  var module = angular.module("angular_l10n", []);

  module.service("L10NService", ["$rootScope", function($rootScope) {
    this.defaultLocale = navigator.language;
    this.prevLocale = this.defaultLocale;
    this.currentLocale = this.defaultLocale;

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

      // If it equals the previous locale then we are in this locale or we have
      // temporarily moved to a different locale for some string with the
      // intention of changing back. No changes required for this.
      // If it does not equal the previous locale, that means we are not in
      // this locale and needs a rerender of the directives and what not. This
      // is even true when locale === this.currentLocale as in that case it is
      // a temporary change. That change won't last and the directives are not
      // recompiled.
      if (locale !== this.prevLocale) {
        this.currentLocale = locale;
        this.prevLocale = locale;
        $rootScope.$broadcast("locale-changed", locale);
      }
    };

    this.setDefaultLocale = function(locale) {
      this.defaultLocale = locale;
      this.setLocale(locale);
    };

    this.reset = function() {
      this.setLocale(this.defaultLocale);
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
        var attrsOriginals = {};
        // Get the translation for attributes
        var attrsToTranslate = element.attr('translate-attr');

        if (!attrsToTranslate) {
          attrsToTranslate = [];
        } else {
          attrsToTranslate = attrsToTranslate.split(",");
        }

        var attr, value;
        for (var i=0; i<attrsToTranslate.length; i++) {
          attr = attrsToTranslate[i].trim();
          value = element.attr(attr);
          if (value) {
            attrsOriginals[attr] = value;
          }
        }

        var doTranslation = function() {
          element.text(L10NService.translate(original));
          for (var attr in attrsOriginals) {
            element.attr(attr, L10NService.translate(attrsOriginals[attr]));
          }
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