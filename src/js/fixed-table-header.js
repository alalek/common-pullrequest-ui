'use strict';

angular.module('fixed.table.header', [])

.run(function($rootScope) {
  (function($) {
    $.fn.fixedTableHeader = function() {
      return this.each(function() {
        var unsupported = false;
        var $this = $(this), $t_fixed = undefined;
        function init() {
          if ($t_fixed)
            $t_fixed.remove();
          $t_fixed = $this.clone();
          $t_fixed.addClass("fth-fixed").css("z-index", 1000);
          $t_fixed.find(".fixed-table-header-hide").hide();
          $t_fixed.find("tbody").remove().end()
              .insertBefore($this);
          resizeFixed();
        }
        function resizeFixed() {
          if (unsupported)
            return;
          if ($t_fixed) {
            $t_fixed.css("width", $this.outerWidth() + "px");
            $t_fixed.find("th").each(
                function(index) {
                  $(this).css("width",
                      $this.find("th").eq(index).outerWidth() + "px");
                });
            setTimeout(function () {
              if ($this.outerWidth() != $t_fixed.outerWidth()) {
                console.log('fixed-table-header: unsupported browser');
                unsupported = true;
                $t_fixed.remove();
                $t_fixed = undefined;
                return;
              }
            }, 0);
            $t_fixed.show();
          }
        }
        function scrollFixed() {
          var offset = $(this).scrollTop(),
              tableBodyOffsetTop = $this.offset().top + $this.find("thead").height(),
              tableBodyOffsetBottom = tableBodyOffsetTop + $this.height() - $this.find("thead").height(),
              offsetLeft = $(this).scrollLeft();
          if (offset < tableBodyOffsetTop || offset > tableBodyOffsetBottom) {
            if ($t_fixed) {
              $t_fixed.hide();
              $t_fixed.remove();
              $t_fixed = undefined;
            }
          }
          else if (offset >= tableBodyOffsetTop
              && offset <= tableBodyOffsetBottom) {
            if ($t_fixed === undefined || $t_fixed.is(":hidden")) {
              init();
            } else {
              resizeFixed();
            }
            if ($t_fixed) {
              $t_fixed.css("left", ($this.offset().left - offsetLeft) + "px");
            }
          }
        }
        $(window).resize(resizeFixed);
        $(window).scroll(scrollFixed);
      });
    };
  })(window.jQuery);
})

.directive('fixedTableHeader', function() {
  return {
    restrict: 'A',
    link : function(scope, element, attrs) {
      element.fixedTableHeader();
    }
  };
})

;
