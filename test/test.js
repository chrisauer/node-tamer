'use strict';
var assert = require('assert');
var Tamer = require('../');
var sinon = require('sinon');

describe('Tamer node module', function () {

  var zkClient, tamer;

  beforeEach(function () {
    zkClient = require('node-zookeeper-client').createClient('localhost:2181');
    tamer = new Tamer('localhost:2181', zkClient);
  });


  describe('while starting', function() {
    it('should call the callback function when connected', function (done) {
      var spy = sinon.spy(zkClient, "once");
      tamer.start().then(function () {
        assert(true, 'called when the client connected');
        spy.reset();
        done();
      });
      tamer.getZkClient().emit('connected', {});
    });
  });
});
