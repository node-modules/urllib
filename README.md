# urllib

Help in opening URLs (mostly HTTP) in a complex world — basic and digest authentication, redirections, cookies and more. Like python  _urllib_ module.

## Install

    $ sudo npm install urllib

## Usage

    urlget('http://www.baidu.com/', {wd: 'cnodejs'}, function(err, data, res) {
        console.log(res.statusCode);
        console.log(res.headers);
        console.log(data.toString());
    });
