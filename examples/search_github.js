// curl https://api.github.com/legacy/user/search/location:china

'use strict';

var urllib = require('../');

urllib.request('https://api.github.com/legacy/user/search/location:china', {dataType: 'json'},
function (err, data, res) {
  console.log(data, res.statusCode, res.headers);
});

// var https = require('https');

// var options = {
//   host: 'api.github.com',
//   port: 443,
//   path: '/legacy/user/search/location:china',
//   method: 'GET'
// };

// var req = https.request(options, function (res) {
//   console.log("statusCode: ", res.statusCode);
//   console.log("headers: ", res.headers);

//   res.on('data', function(d) {
//     process.stdout.write(d);
//   });
// });
// req.end();

// req.on('error', function(e) {
//   console.error(e);
// });
