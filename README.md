# urllib

Help in opening URLs (mostly HTTP) in a complex world — basic and digest authentication, redirections, cookies and more. Like python  _urllib_ module.

## Install

    $ sudo npm install urllib

## Usage

### HTTP GET

    urllib.urlget('http://www.baidu.com/', {wd: 'cnodejs'}, function(err, data, res) {
        console.log(res.statusCode);
        console.log(res.headers);
        console.log(data.toString());
    });

http post juet use 'urlpost' replace 'urlget'

### Fetch HTTP headers only

    urllib.urlget('http://www.google.com/', null, {handle_data: false}, function(err, _, res) {
        console.log(res.statusCode);
        console.log(res.headers);
    };
    
### Don\'t handle 301 or 302 redirect
    
    urllib.urlget('http://www.google.com/', null, {handle_redirect: false}, function(err, data, res) {
        console.log(res.statusCode);
        console.log(res.headers);
    };
    