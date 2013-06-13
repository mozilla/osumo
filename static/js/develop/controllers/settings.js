'use strict';

(function() {
  angular.module('osumo').controller('SettingsViewController', ['$scope', 'title', 'LocaleService', function($scope, title, LocaleService) {
    $scope.locale = LocaleService.currentLocale.locale;
    $scope.languages = window.LANGUAGES;

    title(LocaleService.getTranslation('Settings'));

    $scope.save = function() {
      LocaleService.setDefaultLocale($scope.locale).then(function() {
        $scope.toast({message: LocaleService.getTranslation("Saved.")});
      });
    };
  }]);
})();