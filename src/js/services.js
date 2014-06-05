'use strict';

/* Services */

angular.module('appServices', ['ngResource'])

.run(function () {
  console.log("service run");
})

.factory('PRConfig', function ($http) {
  return {
    query: function(params) { return $http.get('/config/pullrequests-config.json', {'params':params}); }
  };
})

.factory('PR', function ($http) {
  return function(info_service) {
    var baseUrl = info_service.url + info_service.url_pullrequests;
    return {
      queryAll: function(params) { return $http.get(baseUrl, {'params':params}); },
      query: function(id, params) { return $http.get(baseUrl + id, {'params':params}); }
    };
  }
})

// AuthInfo(myUrl).query().success(...).error(...)
.factory('AuthInfo', function ($http) {
  return function(baseUrl) {
    return {
      query: function(params) { return $http.get(baseUrl + 'authInfo', {'params':params}); }
    };
  }
})

.factory('PRMerge', function ($http) {
  return function(repoInfo) {
    return {
      query: function(prid) {
        return $http.post(repoInfo.merge_service.url + 'query',
          {'repoId':repoInfo.id, 'prId':prid});
      },
      queryFast: function(prid) {
        return $http.get(repoInfo.merge_service.url + 'queryFast',
           {params: {'repoId':repoInfo.id, 'prId':prid}});
      },
      merge: function(prid) {
        return $http.post(repoInfo.merge_service.url + 'merge',
            {'repoId':repoInfo.id, 'prId':prid});
      },
    };
  }
})


.factory('AppFilter', function () {
  var filter = function (entries, filter, keyNames) {
    if (filter === undefined)
      return entries;
    if (typeof keyNames === 'string')
      keyNames = [keyNames];
    try {
      var result = [];
      filter = filter.replace(/([^\\]) /g, "$1\n");
      var filterParts = filter.split("\n");
      var filterPatternIncludeParts = [];
      var filterPatternExcludeParts = [];
      var regexpChars = /[^\\][-[\]{}.,^$#\s]/g;
      var regexpCharsReplace = /[-[\]{}()*+?.,\\^$|#\s]/g;
      for (var j = 0, _jlength = filterParts.length; j < _jlength; j++) {
        var p = filterParts[j];
        p = p.toLowerCase();
        if (p.trim().length == 0)
          continue;
        var exclude = (p[0] == '-');
        if (exclude)
          p = p.substring(1);
        if (regexpChars.test(p)) {
          alert.warning('Invalid filter: "' + filter + '" (near "' + p + '")');
          p = p.replace(regexpCharsReplace, "\\$&");
        } else {
          p = p.replace(/\?/g, "[^$]");
          p = p.replace(/\*/g, ".*");
          p = p.replace(/\+/g, ".*");
        }
        if (exclude)
          filterPatternExcludeParts.push(p);
        else
          filterPatternIncludeParts.push(p);
      }
      var include_re = (filterPatternIncludeParts.length == 0) ? undefined :
        new RegExp("("+filterPatternIncludeParts.join("|") + ")", "i");
      var exclude_re = (filterPatternExcludeParts.length == 0) ? undefined :
        new RegExp("("+filterPatternExcludeParts.join("|") + ")", "i");
      //console.log(include_re);
      //console.log(exclude_re);
      entries = entries || [];
      for (var i = 0, _ilength = entries.length; i < _ilength; i++) {
        var e = entries[i];
        for (var j = 0, _jlength = keyNames.length; j < _jlength; j++) {
          var keyName = keyNames[j];
          var keyValue = e[keyName] || '';
          if (include_re !== undefined)
            if (!include_re.test(keyValue))
              continue;
          if (exclude_re !== undefined)
            if (exclude_re.test(keyValue))
              continue;
          result.push(e);
          break;
        }
      }
      return result;
    } catch(err) {
      alert.error(err.message);
      return entries;
    }
  };
  filter.filterByKey = filter;
  return filter;
})

.factory('strLimit', function () {
  return function(input, max) {
    if (input === undefined)
      return "";
    max = parseInt(max);
    if (input.length > max)
      return input.substring(0, max) + "...";
    return input;
  };
})

.factory("formatInterval", function() {
  return function(seconds) {
    if (seconds === undefined)
      return undefined;
    var interval = Math.floor(seconds / 31536e3);
    return interval > 1 ? interval + " years ago" : (interval = Math.floor(seconds / 2592e3), interval > 1 ? interval + " months ago" : (interval = Math.floor(seconds / 604800), interval > 1 ? interval + " weeks ago" : (interval = Math.floor(seconds / 86400), interval > 1 ? interval + " days ago" : (interval = Math.floor(seconds / 3600), interval > 1 ? interval + " hours ago" : (interval = Math.floor(seconds / 60), interval > 1 ? interval + " minutes ago" : Math.floor(seconds) + " seconds ago")))))
  }
})

;
