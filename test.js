
var urllib = require('./');

urllib.urlget('http://baidu.com:3000/', function(e, data) {
	if(e) {
		console.log(e)
	} else {
		console.log('data length', data.length);
	}
	
});

urllib.urlpost('http://localhost:3000/question', {'abc': 123}, function(e, data, res) {
	//console.log(res.statusCode, res.headers)
	console.log('data length', data.length);
	//console.log(data.toString());
});