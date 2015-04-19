
2.3.4 / 2015-04-19
==================

 * feat: show agent status message when request error

2.3.3 / 2015-03-30
==================

 * fix: add ciphers and secureProtocol params support for https request

2.3.2 / 2015-03-29
==================

 * refactor: httpclient custom agent property

2.3.1 / 2015-03-08
==================

 * fix: auto decode gzip content

2.3.0 / 2015-02-16
==================

 * feat: mark off connection state and response state

2.2.2 / 2015-01-21
==================

 * remove unuse event handlers

2.2.1 / 2014-12-10
==================

 * refactor and add more comments
 * add path to error (@coderhaoxin)
 * fix promise example in readme

2.2.0 / 2014-11-28
==================

 * add customResponse option (@fishbar)

2.1.0 / 2014-11-15
==================

 * humanize timeout

2.0.2 / 2014-11-01
==================

 * chore: bump deps version and make test more stable
 * refactor: dont add new property on res object

2.0.1 / 2014-10-15
==================

 * add args.contentType option (@coderhaoxin)
 * Simply the HTTPClient implementation (@JacksonTian)
 * refine urllib code (@JacksonTian)

2.0.0 / 2014-10-13
==================

 * support auto decode charset when dataType set

1.5.2 / 2014-09-15
==================

 * do not check ssl, fix hang up in some node version

1.5.1 / 2014-09-10
==================

 * httpclient add requestThunk()

1.5.0 / 2014-09-10
==================

 * add requestThunk to support co

1.4.1 / 2014-08-28
==================

 * HttpClient support agent and httpsAgent

1.4.0 / 2014-08-27
==================

 * add SocketAssignTimeoutError. #37

1.3.1 / 2014-08-27
==================

 * convert data to string when dataType is text

1.3.0 / 2014-08-26
==================

 * add urllib instance

1.2.1 / 2014-08-26
==================

 * add args.ctx for response event easy logging

1.2.0 / 2014-08-26
==================

 * format Response object fields

1.1.0 / 2014-08-25
==================

 * global `response` event. fixed #35

1.0.0 / 2014-08-25
==================

 * return Promise when callback missing. fixed #33
 * rm Makefile
 * use flat image

0.5.17 / 2014-08-08
==================

 * Remove aborted. joyent/node#7457
 * missing I in urllib logo

0.5.16 / 2014-05-15
==================

 * fix test cases
 * change .once to .on (@alsotang)

0.5.15 / 2014-05-04
==================

 * make callback is optional. close #29
 * rm 0.8 from travis

0.5.14 / 2014-04-21
==================

 * fix #28 user-agent logic bug

0.5.13 / 2014-03-31
==================

 * use digest-header module

0.5.12 / 2014-03-29
==================

 * support Digest access authentication. fix #27
 * add co-urllib desc

0.5.11 / 2014-03-13 
==================

  * improve user-agent, add node version and plaform detail

0.5.10 / 2014-03-11 
==================

  * if body not decode, dont touch it

0.5.9 / 2014-03-10 
==================

  * Support `options.gzip = true` to handle gzip response. fixed #26

0.5.8 / 2014-03-07 
==================

  * remove buffer-concat

0.5.7 / 2014-03-07 
==================

  * no more deps on buffer-concat
  * add default User-Agent: node-urllib/x.x.x
  * add jshint

0.5.6 / 2014-03-05 
==================

  * add data/res to error
  * fix typo (@coderhaoxin)
  * access npmjs.org https
  * fix test cases and use autod
  * install from cnpm
  * no more support on node 0.6.x

0.5.5 / 2013-12-10 
==================

  * should pass done instead of callback and end the writeStream
  * support args.writeStream with follow redirect (@dead-horse)

0.5.4 / 2013-11-09 
==================

  * fix timeout not effect bug

0.5.3 / 2013-10-18 
==================

  * add args.beforeRequest(options) hook to change options before http send

0.5.2 / 2013-09-23 
==================

  * add JSONResponseFormatError; append request url infomation to err.message

0.5.1 / 2013-08-23 
==================

  * detect connect timeout or response timeout fixed #18
  * update doc

0.5.0 / 2013-08-11 
==================

  * Support max redirects to protect loop redirect
  * Auto redirect handle (@ibigbug)

0.4.4 / 2013-08-10 
==================

  * handle json response to null when data size is zero

0.4.3 / 2013-08-10 
==================

  * Auto convert data to json string when content-type is 'json' fixed #15
  * add drone.io status build image

0.4.2 / 2013-08-10 
==================

  * fix SELF_SIGNED_CERT_IN_CHAIN test case on node 0.8 and 0.6
  * [√] https & self-signed certificate

0.4.1 / 2013-08-05 
==================

  * return RemoteSocketClosedError when Remote socket was terminated before `response.end()` was called

0.4.0 / 2013-08-05 
==================

  * If the underlaying connection was terminated before `response.end()` was called, `res.aborted` should be `true`. fixed #14
  * fixed test case for 0.6
  * add res.socket.end() test cases
  * remove 0.11 from travis

0.3.8 / 2013-08-02 
==================

  * add debug log

0.3.7 / 2013-07-11 
==================

  * PATCH method is also "application/x-www-form-urlencoded" by default
  * replace logo

0.3.6 / 2013-07-11 
==================

  * fixed bug in processing query string #13 (@xingrz)
  * updated readme example (@xingrz)
  * update authors
  * API docs (@xingrz)

0.3.5 / 2013-07-10 
==================

  * fixed writeSteam receive incomplete bug
  * update makefile
  * add coveralls
  * remove 0.11 from travis
  * add patch for node 0.6
  * fixed https request timeout tests
  * use blanket instead of jscover

0.3.4 / 2013-03-06 
==================

  * fixed #8 auto add application/x-www-form-urlencoded
  * fixed existsSync for node < 0.8

0.3.3 / 2012-12-14 
==================

  * support writeStream

0.3.2 / 2012-11-08 
==================

  * fixed #4 support urllib.request(options, args, callback)
  * fixed usage demo bug
  * fixed readme

0.3.1 / 2012-11-05 
==================

  * fixed #2 support stream and return the req object.
  * use jscover instead of jscoverage

0.3.0 / 2012-10-10 
==================

  * add coverage results
  * Bash auth support: `http://user:password@http://demo.com` .
