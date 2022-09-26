const HttpClient = require('..').HttpClient;

tryHttpclient(HttpClient, 'urllib');

function tryHttpclient(HttpClient, name) {
  const options = {
    method: 'GET',
    timeout: 10000,
    timing: true,
  };
  const urllib = new HttpClient();
  urllib.on('response', function(info) {
    // console.log(name, httpAgent, httpAgent.getCurrentStatus());
    // console.log(name, httpsAgent, httpsAgent.getCurrentStatus());
    console.log(name, info.res);
  });
  urllib.request('https://nodejs.org', options)
    .then(function() {
      return urllib.request('https://nodejs.org', options);
    })
    .then(function() {
      return urllib.request('https://nodejs.org/en/', options);
    })
    .catch(function(err) {
      console.error(err);
    });
}
