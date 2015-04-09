'use strict';

var zookeeper = require('node-zookeeper-client');
var Q = require('Q');
var _ = require('lodash');


var PathChildrenCache = function (framework, path) {
  this.framework = framework;
  this.path = path;
  // path watcher for finding new nodes
  var context = this;
  this.watcher = function () {
    context.rebuild();
  };
};


PathChildrenCache.prototype.start = function () {
  this.cache = {};
  return this.rebuild();
};

PathChildrenCache.prototype.rebuild = function () {
  var defer = Q.defer();
  var context = this;
  this.framework
    .getZkClient()
    .getChildren(this.path,function (error, children) {
      _.forEach(children, function (child) {
        context.cache[child] = Q.defer();
        context
          .framework
          .getZkClient()
          .getData(context.path + '/' + child, context.watcher, function (err, buffer) {
            context.cache[child].resolve(buffer);
          });
      });
      defer.resolve();
    });
  return defer.promise;
};

PathChildrenCache.prototype.get = function (item) {
  return this.cache[item].promise;
};


/**
 *
 */
var TamerFramework = function (connectionString, existing) {
  // allows for mocking for unit testing
  if (existing) {
    this.client = existing;
  }
  // default behavior is to create the client with the connectionstring
  else {
    this.client = zookeeper.createClient(connectionString);
  }
};

TamerFramework.prototype.start = function () {
  var defer = Q.defer();
  this.client.once('connected', function () {
    defer.resolve();
  });
  this.client.connect();
  return defer.promise;
};

TamerFramework.prototype.newPathChildrenCache = function (path) {
  return new PathChildrenCache(this, path);
};

TamerFramework.prototype.getZkClient = function () {
  return this.client;
};

module.exports = TamerFramework;
