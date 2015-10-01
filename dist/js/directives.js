'use strict';

angular.module('appDirectives', [])

.directive('footer', function() {
  return {
    restrict: 'C',
    link : function(scope, element, attrs) {
      var prevSize = -1;
      var checkResize = function () {
        setTimeout(function () {
          //console.log("checkResize...");
          var newSize = element.height();
          if (newSize === prevSize)
            return;
          prevSize = newSize;
          //console.log("new size: ", newSize);
          $(".footer-push").css({top:newSize});
        }, 50);
      };
      var forceResize = function () {
        var newSize = element.height();
        prevSize = newSize;
        //console.log("forced new size: ", newSize);
        $(".footer-push").css({top:newSize});
      };
      $(element).bind("forceFooterSizeCheck", forceResize);
      $(element).bind("DOMSubtreeModified", checkResize);
      var isHidden = false;
      var resizeTimer = undefined;
      var windowResize = function(e) {
        var doJob = function() {
          checkResize();
          var w = $(window).width();
          var h = $(window).height();
          var hideNeeded = (w < 350) || (h < 350);
          if (hideNeeded != isHidden)
          {
            //console.log("footer hide=" + hideNeeded);
            if (hideNeeded)
              $(".footer").css({display:"none"});
            else
              $(".footer").css({display:"block"});
            isHidden = hideNeeded;
          }
        };
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(doJob, 200);
      };
      $(window).bind("resize", windowResize);
    }
  };
})


// <div click-link="/partial">
.directive('clickLink', function($location) {
  return {
    link : function(scope, element, attrs) {
      element.on('click', function() {
        scope.$apply(function() {
          $location.path(attrs.clickLink);
        });
      });
    }
  };
})

.directive('toggleId', function() {
  return {
    link : function(scope, element, attrs) {
      element.on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        scope.$apply(function() {
          var e = $(attrs.toggleId);
          e.trigger("click", event);
        });
      });
    }
  };
})

/*
.directive('isPrFiltered', function() {
  return {
    link : function(scope, element, attrs) {
      scope.$watch('isPRFiltered', function (newValue) {
        if (newValue)
          element.addClass('filtered');
        else
          element.removeClass('filtered');
      });
    }
  };
})

.directive('isBuildersFiltered', function() {
  return {
    link : function(scope, element, attrs) {
      scope.$watch('isBuildersFiltered', function (newValue) {
        if (newValue)
          element.addClass('filtered');
        else
          element.removeClass('filtered');
      });
    }
  };
})
*/

.directive('modalWindow', function() {
  return {
    link : function(scope, element, attrs) {
      var e = $(".footer-push", element)[0];
      if (!e) {
        $(element).append('<div class="footer-push"></div>');
        $(".footer").trigger("forceFooterSizeCheck");
      }
    }
  };
})

/*.directive('bindOnce', function() {
  return {
    scope : true,
    link : function($scope, element, attrs) {
      setTimeout(function() {
        console.log($scope);
        $scope.$destroy();
        $(".ng-binding", element).removeClass('ng-binding');
        $(".ng-scope", element).removeClass('ng-scope');
      }, 1000);
    }
  };
})
*/

/*// apply-url
.directive('applyUrl', function() {
  return {
    scope : true,
    link : function($scope, element, attrs) {

    }
  };
})
*/

/*
.directive('marked', function($window) {
  return {
    restrict : 'AE',
    replace : true,
    scope : {
      opts : '=',
      marked : '='
    },
    link : function(scope, element, attrs) {
      var marked = $window.marked;

      set(scope.marked || element.text() || '');

      function set(val) {
        var lines = val.split(/[\r]*\n/);
        val = _(lines).map(function(l) { return l.replace(/^([^ ]+=.*)$/, "`$&`") }).join('\n');
        element.html(marked(val || '', scope.opts || {breaks:true}));
      }

      if (attrs.marked) {
        scope.$watch('marked', set);
      }
    }
  };
})
*/

// <div time-interval="build.last_update"/>
.directive('timeInterval', function(formatInterval) {
  return {
    restrict : 'A',
    replace : true,
    scope : {
      timeInterval : '='
    },
    link : function(scope, element, attrs) {

      function set(val) {
        if (scope.timeInterval !== undefined)
          element.html('<span>' + formatInterval(scope.timeInterval) + '</span>');
      }

      if (attrs.timeInterval) {
        scope.$watch('timeInterval', set);
      }
    }
  };
})

;
