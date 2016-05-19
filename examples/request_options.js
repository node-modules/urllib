'use strict';

var urllib = require('../');

urllib
  .config({
    dataType: 'json'
  })
  .method('GET')
  .beforeRequest(function() {
    console.log('--------------->', 'greed is good');
  })
  .request('https://api.github.com/legacy/user/search/location:china')
  .then(function (res) {
    console.log(res.data);
  });

