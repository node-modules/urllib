/**
 * Module dependencies.
 */

if (process.env.JSCOV) {
    var jscover = require('jscoverage');
    require = jscover.require(module);
    require(__dirname + '/../', true);
    process.on('exit', jscover.coverage);
}

var urllib = require('../');
var should = require('should');

/* {{{ private function implode_buffer_chunks() */
function implode_buffer_chunks(chunks)
{
    var len = 0;
    for (var i = 0; i < chunks.length; i++) {
        len += chunks[i].length;
    }

    var pos = 0;
    var buf = new Buffer(len);
    for (var i = 0; i < chunks.length; i++) {
        chunks[i].copy(buf, pos);
        pos += chunks[i].length;
    }

    return buf;
}
/* }}} */

/* {{{ mock http server for unittest */

var HTTP    = require('http').createServer(function(req, res) {
    var chunks  = [];
    req.on('data', function(buf) {
        chunks.push(buf);
    });

    req.on('end', function() {
        var url = req.url.split('?');
        var get = require('querystring').parse(url[1]);

        if (chunks.length) {
            var ret = implode_buffer_chunks(chunks).toString();
        } else {
            var ret = '<html><head><meta http-equiv="Content-Type" content="text/html;charset=##{charset}##">...</html>';
        }

        chunks  = [];
        res.writeHead(get.code ? get.code : 200, {
            'Content-Type'  : 'text/html',
        });
        res.end(ret.replace('##{charset}##', get.charset ? get.charset : 'i_am_not_defined'));

    });
}).listen(33749);
/* }}} */

describe('urllib-test', function() {

    /* {{{ should_mocked_http_service_works_fine() */
    it('should_mocked_http_service_works_fine' ,function(done) {
        urllib.request('http://127.0.0.1:33749?a=12&code=302', function(error, data, res) {
            should.ok(!error);
            data.should.be.an.instanceof(Buffer);
            res.statusCode.should.eql(302);
            done();
        });
    });
    /* }}} */

    /* {{{ should_return_charset_works_fine() */
    it('should_return_charset_works_fine', function(done) {
        var charset = ['gb2312', 'gbk', 'utf-8'];

        var waitnum = charset.length + 1;
        charset.forEach(function(item) {
            urllib.request('http://127.0.0.1:33749?code=200&charset=' + item, function(error, data, res) {
                should.ok(!error);
                item.should.eql(urllib.get_charset(res, data));
                if ((--waitnum) < 1) {
                    done();
                }
            });
        });

        var options = {
            'type'  : 'POST',
            'data'  : '<html><meta http-equiv="refresh" content="0;url=http://www.baidu.com/"></html>',
        };
        urllib.request('http://127.0.0.1:33749', options, function(error, data, res) {
            if ((--waitnum) < 1) {
                done();
            }
        });
    
    });
    /* }}} */

});

after(function() {
    HTTP.close();
});

