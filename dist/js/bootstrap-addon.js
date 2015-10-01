'use strict';

/* Directives */

var bootstrapAddons = angular.module('bootstrapAddons', []);

// dropdown-close
bootstrapAddons.directive('dropdownClose', function() {
    var directiveDefinitionObject = {
        restrict : 'AEC',
        link : function(scope, element, attrs) {
            $(element).click(function() {
                var e = element.closest(".dropdown-menu").prev()[0];
                $(e).trigger("click");
            });
        }
    };
    return directiveDefinitionObject;
})

// dropdown-prevent-close: prevent dropdown closing in click
.directive('dropdownPreventClose', function () {
  var directiveDefinitionObject = {
    restrict: 'AEC',
    link : function(scope, element, attrs) {
      element.bind('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
      });
    }
  };
  return directiveDefinitionObject;
})

.directive('autofocus', function() {
  return {
    link : function(scope, element, attrs) {
      var menu = element.closest(".dropdown-menu");
      if (!menu)
        return;
      var toggleElem = menu.prev()[0];
      if (!toggleElem)
        return;
      $(toggleElem).on('click', function() {
        var e = $("input.autofocus", menu)[0];
        if (e)
          e = $(e).focus();
      });
    }
  };
});
