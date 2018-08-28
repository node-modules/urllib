'use strict';

var Benchmark = require('benchmark');
var http = require('http');
var urllib = require('../');
var suite = new Benchmark.Suite();
var agent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 5000,
  maxSockets: 100,
  timeout: 5000,
});

function request(trace, deferred) {
  urllib.request('http://127.0.0.1:8080', {
    timeout: 20000,
    trace: trace,
    agent: agent,
  }).then(function() {
    deferred.resolve();
  });
}

suite
  .add('warm up agent', {
    defer: true,
    fn: function(deferred) {
      request(false, deferred);
    }
  })
  .add('request with no trace', {
    defer: true,
    fn: function(deferred) {
      request(false, deferred);
    }
  })
  .add('request with trace', {
    defer: true,
    fn: function(deferred) {
      request(true, deferred);
    }
  })
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  // run async
  .run({ 'async': true });
