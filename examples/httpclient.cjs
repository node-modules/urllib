'use strict';

const HttpClient = require('..').HttpClient;

tryHttpclient(HttpClient, 'urllib');

function tryHttpclient(HttpClient, name) {
  const options = {
    method: 'HEAD',
    timeout: 10000,
  };
  const urllib = new HttpClient();
  urllib.on('response', function(info) {
    console.log(name, httpAgent, httpAgent.getCurrentStatus());
    console.log(name, httpsAgent, httpsAgent.getCurrentStatus());
    console.log(name, info.res.keepAliveSocket);
  });
  urllib.request('http://nodejs.org', options)
    .then(function() {
      return urllib.request('http://nodejs.org', options);
    })
    .then(function() {
      return urllib.request('http://nodejs.org', options);
    })
    .catch(function(err) {
      console.error(err);
    });
}
