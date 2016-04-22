'use strict';

var zookeeper = require('node-zookeeper-client');
var Q = require('q');
var _ = require('lodash');

/**
 * Path Children Cache maintains a local cache of
 * all the children locally and manages the watches
 * to keep the cache up to date
 * 
 * @constructor
 * @param {TamerFramework} framework - the tamer framework object
 * @param {string} path - path to cache locally
 */
var PathChildrenCache = function (framework, path) {
  this.framework = framework;
  this.path = path;
  // path watcher for finding new nodes
  var context = this;
  this.watcher = function () {
    context.rebuild();
  };
};


/**
 * Start must be called on a cache object in order to rebuild the local cache
 *
 * @return {promise}  promise that resolves when cache is ready
 */
PathChildrenCache.prototype.start = function () {
  this.cache = {};
  return this.rebuild();
};


/**
 * rebuild the cache object based on ethe current list of children
 *
 * @return {promise}  promise that resolves when cache is rebuilt
 */
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


/**
 * get the value of a property on the path
 *
 * @param  {string}  property - property to get from cache
 * @return {promise} promise that resolves with the items value
 */
PathChildrenCache.prototype.get = function (item) {
  return this.cache[item].promise;
};



/**
 * TamerFramework - framework class for managing the
 * connection to zookeeper
 *
 * @constructor
 * @param  {string} connectionString description
 * @param  {json}   authInfo         json containing zookeeper Auth scheme and user id
 * @param  {client} existing         optional existing zookeeper client mostly used for testing
 */
var TamerFramework = function (connectionString, authInfo, existing) {
  // allows for mocking for unit testing
  if (existing) {
    this.client = existing;
  }
  // default behavior is to create the client with the connectionstring
  else {
    this.client = zookeeper.createClient(connectionString);
  }

  if(authInfo && authInfo.scheme && authInfo.userId) {
    this.client.addAuthInfo(authInfo.scheme, new Buffer(authInfo.userId));
  }
};


/**
 * start the framework
 *
 * @return {promise}  resolves once the framework has connected to zookeeper
 */
TamerFramework.prototype.start = function () {
  var defer = Q.defer();
  this.client.once('connected', function () {
    defer.resolve();
  });
  this.client.connect();
  return defer.promise;
};


/**
 * Create a new path children cache object from this framework
 *
 * @param  {string} path  node path to cache
 * @return {PathChildrenCache}      cache object for the given path
 */
TamerFramework.prototype.newPathChildrenCache = function (path) {
  return new PathChildrenCache(this, path);
};

TamerFramework.prototype.getZkClient = function () {
  return this.client;
};

module.exports = TamerFramework;
