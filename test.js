
var urllib = require('./');

//urllib.urlget('http://baidu.com:3000/', function(e, data) {
//	if(e) {
//		console.log(e);
//	} else {
//		console.log('data length', data.length);
//	}
//	
//});

//urllib.urlpost('http://localhost:3000/question', {'abc': 123}, function(e, data, res) {
//	//console.log(res.statusCode, res.headers)
//	console.log('data length', data.length);
//	//console.log(data.toString());
//});

var chrome_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_7) AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.742.53 Safari/534.30';
urllib.urlget('http://www.baidu.com/', 
        {wd: 'cnodejs'}, 
        {headers: {'user-agent': chrome_agent}}, 
        function(err, data, res) {
    console.log(res.statusCode);
    console.log(res.headers);
    console.log(data.toString());
});

urllib.urlget('http://www.baidu.com/', 
        {wd: 'cnodejs'}, 
        function(err, data, res) {
    console.log(res.statusCode);
    console.log(res.headers);
    console.log(data.toString());
});