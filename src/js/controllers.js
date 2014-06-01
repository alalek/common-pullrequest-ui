'use strict';

/* Controllers */

angular.module('prControllers', ['appServices'])

.controller('PRSummaryCtrl', function($scope, PRConfig, PR, PRMerge, AuthInfo, $timeout, $http, $q, $modal, AppFilter, strLimit) {

  $scope.dummyBuilds = [];

  $scope.doLogin = function () {
    $http({method: 'GET', url: '/login'}).
      success(function(data, status, headers, config) {
        alert.success('Login: success');
        window.location.reload();
      }).
      error(function(data, status, headers, config) {
        alert.error('Login: failed');
      });
  };

  function markdown2html(val) {
    var lines = val.split(/[\r]*\n/);
    val = _(lines).map(function(l) {
      l = l.replace(/^([^ ]+=.*)$/, "`$&`");
      l = l.replace(/(#[\d]+)/, "`$&`");
      return l;
    }).join('\n');
    return marked(val || '', {'breaks':true});
  }

  var BuildStatus = (function () {
    var BuildStatus = function () {
      this.buildstatus = new BuildStatusCollection(this);
    };

    BuildStatus.prototype = {
      update: function(data) {
        _.assign(this, data);
        return this;
      },
      clear: function() {
        var that = this;
        _.forEach(this, function(value, key) {
          if (key == 'builderId')
            return;
          if (!_.isFunction(value)/* && key[0] != '$'*/)
            delete that[key];
        });
        return this;
      },
      assign: function(data) {
        this.clear();
        this.update(data);
        return this;
      },
      scheduleUpdate: function (scope, timeout) {
        var build = this;
        var reload = function() {
          $timeout.cancel(build.$updateTimeout);
          build.$updateTimeout = undefined;
          if (build.operation_in_progress)
            return;
          try {
            if ($scope.pullrequests.get(scope.pr.id).buildstatus.get(build.builderId) !== build)
              return;
          } catch (e) {
            return;
          }
          if (_.isArray(timeout) && timeout.length > 1)
            build.scheduleUpdate(scope, timeout.slice(1));

          var builder = _.find(scope.builders, {id : build.builderId});
          var buildName = 'PR #' + scope.pr.id + " (" + scope.builder.name + ")";
          alert.warning(buildName + ": Updating status...");
          var buildUrl = scope.builder.baseUrl + "/" + build.operations_url;
          return $http({method: 'GET', url: buildUrl})
          .success(function(data, status, headers, config) {
            build.assign(data);
            alert.success(buildName + ": Updated!");
          })
          .error(function(data, status, headers, config) {
            alert.error(buildName + ": Update FAILED! (" + status + (data ? "-" + data.message : "") + ")!");
          });
        };
        if (build.$updateTimeout !== undefined)
          $timeout.cancel(build.$updateTimeout);
        build.$updateTimeout = $timeout(reload, _.isArray(timeout) ? timeout[0] : timeout);
      },
    };

    return BuildStatus;
  })();

  var BuildStatusCollection = (function (_pr) {
    var pr = _pr;

    var BuildStatusCollection = function () {
    };

    BuildStatusCollection.prototype = {
      get: function(id) {
        var bs = this[id];
        if (bs === undefined) {
          bs = new BuildStatus();
          bs.builderId = id;
          this[id] = bs;
        }
        return bs;
      },
      assign: function(id, data) {
        return this.get(id).assign(data);
      }
    };

    return BuildStatusCollection;
  })();

  var PullRequest = (function () {
    var PullRequest = function () {
      this.buildstatus = new BuildStatusCollection(this);
    };

    PullRequest.prototype = {
      updateAll: function(data) {
        var that = this;
        _.forEach(data, function(value, key) {
          if (key == 'buildstatus') {
            _.forEach(data.buildstatus, function(bs, bid) {
              that.buildstatus.assign(bid, bs);
            });
            return;
          }
          that[key] = value;
        });
        if (this.description !== undefined) {
          this.description_html = markdown2html(this.description);
          this.description_short_html = markdown2html(strLimit(this.description, 512));
        } else {
          this.description_html = undefined;
          this.description_short_html = undefined;
        }
        return this;
      },
      updateBuildStatus: function(data) {
        var that = this;
        _.forEach(data.buildstatus, function(bs, bid) {
          that.buildstatus.assign(bid, bs);
        });
        return this;
      },
      clear: function() {
        var that = this;
        _.forEach(this, function(value, key) {
          if (key == 'id')
            return;
          if (!_.isFunction(value)/* && key[0] != '$'*/)
            delete that[key];
        });
        this.buildstatus = new BuildStatusCollection(this);
        return this;
      },
      assign: function(data) {
        this.clear();
        this.updateAll(data);
        return this;
      },
      scheduleUpdate: function (timeout) {
        var pr = this;
        var reload = function() {
          $timeout.cancel(pr.$updateTimeout);
          pr.$updateTimeout = undefined;
          try {
            if ($scope.pullrequests.get(pr.id) !== pr)
              return;
          } catch (e) {
            return;
          }
          if (_.isArray(timeout) && timeout.length > 1)
            pr.scheduleUpdate(timeout.slice(1));

          var prName = 'PR #' + pr.id;
          alert.warning(prName + ": Updating status...");
          return PR(pr.info_service).query(pr.id)
          .success(function(data, status, headers, config) {
            pr.updateAll(data);
            alert.success(prName + ": Updated!");
          })
          .error(function(data, status, headers, config) {
            alert.error(prName + ": Update FAILED! (" + status + (data ? "-" + data.message : "") + ")!");
          });
        };
        if (pr.$updateTimeout !== undefined)
          $timeout.cancel(pr.$updateTimeout);
        pr.$updateTimeout = $timeout(reload, _.isArray(timeout) ? timeout[0] : timeout);
      },
      cancelUpdate: function() {
        if (this.$updateTimeout !== undefined)
          $timeout.cancel(this.$updateTimeout);
        this.$updateTimeout = undefined;
      },
      queryMerge: function () {
        var pr = this;

        if (pr.merge != undefined) {
          if (pr.merge.$timeoutHandle) {
            $timeout.cancel(pr.merge.$timeoutHandle);
            pr.merge.$timeoutHandle = undefined;
          }
        }
        var clearMergeInfo = function() {
          pr.merge.$timeoutHandle = undefined;
          delete pr['merge'];
        }

        var prName = 'PR #' + pr.id;
        alert.warning(prName + ": Quering merge status...");
        return PRMerge($scope.repoInfo).query(pr.id)
        .success(function(data, status, headers, config) {
          pr.merge = data;
          pr.merge.$timeoutHandle = $timeout(clearMergeInfo, 60000);
          alert.success(prName + ": merge status received!");
        })
        .error(function(data, status, headers, config) {
          alert.error(prName + ": Query FAILED! (" + status + (data ? "-" + data.message : "") + ")!");
        });
      },
      doMerge: function () {
        var pr = this;

        var prName = 'PR #' + pr.id;
        var res = confirm("I do really want to merge pull request #" + pr.id + " to branch " + pr.branch);
        if (!res) {
          alert.warning(prName + ": merge cancelled by user...");
          return false;
        }

        alert.warning(prName + ": merging...");
        return PRMerge($scope.repoInfo).merge(pr.id)
        .success(function(data, status, headers, config) {
          alert.success(prName + ": merge succeded!");
          $scope.openModalMessage(data.message, data.detail);
        })
        .error(function(data, status, headers, config) {
          alert.error(prName + ": merge FAILED! (" + status + (data ? "-" + data.message : "") + ")!");
          $scope.openModalMessage(data.message, data.detail);
        });
        return true;
      },
    };

    return PullRequest;
  })();

  var PRCollection = (function () {
    var PRCollection = function () {
    };

    PRCollection.prototype = {
      get: function(id) {
        var pr = this[id];
        if (pr === undefined) {
          pr = new PullRequest();
          pr.id = id;
          this[id] = pr;
        }
        return pr;
      },
      assign: function(id, data) {
        return this.get(id).assign(data);
      }
    };

    return PRCollection;
  })();

  $scope.loadAll = function () {
    alert.success("Reload data...");

    var target = {}
    target.repoName = undefined;
    target.repositories = undefined;
    target.repoInfo = undefined;
    target.authInfo = undefined;
    target.pullrequests = new PRCollection();
    target.builders = undefined;

    var cfgPromise = $q.defer();

    PRConfig.query()
    .success(function(config) {
      var repoName = $scope.repoName;  // opencv, opencv_contrib, private GitLab, etc
      target.repositories = config.repositories;
      var repoInfo = _.find(config.repositories, {id:repoName});
      if (repoInfo === undefined) {
        if (repoName !== undefined) {
          alert.error("Invalid repo name: " + repoName);
          return;
        }
        repoInfo = config.repositories[0];
        repoName = repoInfo.id;
      }
      target.repoName = repoName;
      target.repoInfo = repoInfo;
      alert.success("Loading data for repo '" + repoName + "' ...");

      var loadPromises = [];

      if (repoInfo.merge_service !== undefined) {
        var authPromize = $q.defer();
        AuthInfo(repoInfo.merge_service.url).query()
        .success(function (res) {
          alert.success("User: '" + res.user + "'" + (res.mergeRight ? " with merge right" : ""));
          target.authInfo = res;
        })
        .error(function(data, status, headers, config) {
          alert.error("No user info - " + status + (data.message ? " (" + data.message + ")" : ""));
        })['finally'](authPromize.resolve);
        loadPromises.push(authPromize.promise);
      } else {
        alert.warning("Merge service is not available");
      }

      _.forEach(repoInfo.info_services, function(info_service) {
        var info_service_name = info_service.id;
        var infoPromise = $q.defer();
        PR(info_service).queryAll()
        .success(function(data, status, headers, config) {
          var info = data;
          target.builders = info['builders'];

          _.each(target.builders, function (builder) {
            $scope.dummyBuilds[builder.id] = {builderId: builder.id};
            builder.baseUrl = info_service.url;
          });

          _.forEach(info['pullrequests'], function(prdata, id) {
            var pr = target.pullrequests.get(id);
            prdata.info_service = info_service;
            if (pr.author === undefined)
              target.pullrequests.assign(id, prdata);
            else
              pr.updateBuildStatus(prdata)
          });
          alert.success("Loaded info from '" + info_service_name + "'");
        })
        .error(function(data, status, headers, config) {
          alert.error("Can't load pullrequests data for " + info_service_name + " (" + status + (data ? "-" + data.message : "") + ")");
        })['finally'](infoPromise.resolve);
        loadPromises.push(infoPromise.promise)
      });
      $q.all(loadPromises).then(function(values) {
        cfgPromise.resolve();
      });
    })
    .error(function () {
      alert.error("Can't load service configuration");
      cfgPromise.resolve();
    });

    cfgPromise.promise.then(function() {
      _.forEach(target, function(value, key) {
        $scope[key] = value;
      });
      alert.success("Data is updated");
    });

    return true;
  };
  $scope.loadAll();

  var prev_visible_builders = 0;
  function updateBuilders() {
    var entries = _.values($scope.builders) || [];
    var buildersList = AppFilter.filterByKey(entries, $scope.builderFilter, 'name');
    if (prev_visible_builders != buildersList.length) {
      prev_visible_builders = buildersList.length;
      alert.success('Updating builders list: '+ buildersList.length);
    }
    if (buildersList.length === 0 && entries.length > 0) {
      buildersList = [{'name':'check filter', 'id':-1}];
    }
    $scope.filteredBuilders = buildersList;
    $scope.isBuildersFiltered = ($scope.builderFilter || "") !== "";
  };
  $scope.$watchCollection('[builderFilter, builders]', updateBuilders);
  $scope.$watchCollection('builders', updateBuilders);

  $scope.resetBuilderFilter = function () {
    alert.warning('Reset builder filter');
    $scope.builderFilter = undefined;
  };

  $scope.getBuilderRenderClass = function () {
    if ($scope.isBuildersFiltered)
      return "filtered";
    return undefined;
  };

  var prev_visible_pullrequests = 0;
  function updatePullrequests() {
    var entries = _.values($scope.pullrequests) || [];
    entries = _.sortBy(entries, 'id').reverse();
    entries = AppFilter.filterByKey(entries, $scope.prIdFilter, ['id', 'branch']);
    entries = AppFilter.filterByKey(entries, $scope.prNameFilter, ['title', 'description']);
    entries = AppFilter.filterByKey(entries, $scope.prAuthorFilter, ['author', 'assignee']);
    if (prev_visible_pullrequests != entries.length) {
      prev_visible_pullrequests = entries.length;
      alert.success('Updating PR list: '+ entries.length);
    }
    if (entries.length === 0) {
      entries = [{'name':'check pullrequests filter', buildstatus:[]}];
    }
    $scope.filteredPullrequests = entries;
    $scope.isPRFiltered = (($scope.prIdFilter || "") + ($scope.prNameFilter || "") +
        ($scope.prAuthorFilter || "")) !== "";
  };
  $scope.$watchCollection('[prIdFilter, prNameFilter, prAuthorFilter]', updatePullrequests);
  $scope.$watchCollection('pullrequests', updatePullrequests);

  function updatePRBuilds() {
    _.forEach($scope.filteredPullrequests, function(pr) {
      var result = _.map($scope.filteredBuilders, function (builder) {
        var builderId = builder.id;
        var build = pr.buildstatus[builderId];
        return build || $scope.dummyBuilds[builderId];
      });
      pr.$builds = result;
    });
  };
  $scope.$watchCollection('filteredBuilders', updatePRBuilds);
  $scope.$watchCollection('filteredPullrequests', updatePRBuilds);

  
  $scope.resetPRFilter = function () {
    alert.warning('Reset PR filters');
    $scope.prIdFilter=undefined;
    $scope.prNameFilter=undefined;
    $scope.prAuthorFilter=undefined;
  };

  $scope.getPRRenderClass = function () {
    if ($scope.isPRFiltered)
      return "filtered";
    return undefined;
  };

  $scope.updatePRBind = function () {
    var pr = this.pr;
    if (pr !== undefined)
      pr.scheduleUpdate([5000, 10000, 10000, 10000, 30000, 60000, 300000, 600000, 1200000]);
  };

  $scope.updatePRUnbind = function () {
    var pr = this.pr;
    if (pr !== undefined)
      try { pr.cancelUpdate(); } catch (e) { }
  };

  $scope.getBuilds = function () {
    var pr = this.pr;
    return pr.$builds;
  };

  $scope.getBuildsModal = function () {
    var pr = this.pr;
    var filteredBuilders = $scope.filteredBuilders;
    var result = _.map(filteredBuilders, function (builder) {
      var builderId = builder.id;
      var build = pr.buildstatus[builderId];
      return build || $scope.dummyBuilds[builderId];
    });
    return result;
  };

  $scope.openModal = function() {
    var pr = this.pr;
    var options = {};
    angular.extend(options, {
      templateUrl: '/partials/pr-detail-modal.html',
      controller: 'PRDetailCtrl',
      scope: this,
      windowClass: 'fullwidth'
    });
    var done = function() {
      alert.success('PR details closed ('+pr.id+'): '+ Date.now());
    };
    $modal.open(options).result.then(done, done);
  };
  
  $scope.openModalMessage = function(title, message) {
    var options = {
      templateUrl: '/partials/modal-message.html',
      controller: 'ModalMessageCtrl',
      resolve: {
        title: function() { return title; },
        message: function() { return message; }
      },
      windowClass: 'fullwidth'
    };
    var done = function() {
      // nothing
    };
    $modal.open(options).result.then(done, done);
  };

})

.controller('PRDetailCtrl', function($scope, $routeParams, PR, $modalInstance) {
  if ($modalInstance) {
    $scope.close = function () {
      $modalInstance.close();
    };
  } else {
    $scope.pr = PR.get({prId: $routeParams.prId}, function(pr) {
      alert.success('Details for PR loaded: '+ Date.now());
    });
  }
})

.controller('BuildController', function($scope, $rootScope, $timeout, $http) {
  if ($scope.build === undefined)
    return;
  var builderId = $scope.build.builderId;
  $scope.builder = _.find($scope.builders, {id : builderId});
  $scope.getBuildTemplate = function() {
    if ($scope.build.status === undefined)
      return 'partials/build-detail-none.html';
    else
      return 'partials/build-detail.html';
  };
  $scope.getBuildRenderClass = function() {
    /*if ($scope.build.operation_in_progress)
      return undefined;*/
    if ($scope.build.status === undefined)
      return undefined;
    else
      return "status-" + $scope.build.status;
  };
  $scope.doOperation = function(op) {
    var buildName = 'PR #' + $scope.pr.id + " (" + $scope.builder.name + ")";
    alert.warning(buildName + " - " + op + "...");
    var build = $scope.build;
    if (build.operation_in_progress) {
      alert.error(buildName + " - " + op + " - other in progress!");
      return;
    }
    build.operation_in_progress = true;
    var buildUrl = $scope.builder.baseUrl + build.operations_url;
    var buildOperationUrl = buildUrl + "/" + op;
    var build_status = build.status;
    $http({method: 'POST', url: buildOperationUrl, data: {updated_at:build.updated_at}})
    .success(function(data, status, headers, config) {
      var info = data;
      build.assign(data);
      alert.success(buildName + ": DONE!");
      build.scheduleUpdate($scope, [5000, 10000, 10000, 10000, 20000, 30000, 60000, 60000, 300000]);
    })
    .error(function(data, status, headers, config) {
      alert.error(buildName + " - " + op + " - FAILED (" + status + (data ? "-" + data.message : "") + ")!");
      delete build.operation_in_progress;
      $scope.loadAll();
    });
  };
  $scope.updateBuildStatus = function() {
    $scope.build.scheduleUpdate($scope, [500, 5000]);
  }

})

.controller('ModalMessageCtrl', function($scope, $modalInstance, title, message) {
  $scope.title = title;
  $scope.message = message;
  $scope.close = function () {
    $modalInstance.close();
  };
})


;
