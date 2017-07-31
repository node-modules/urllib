
2.24.0 / 2017-07-31
==================

  * feat: support http(s) proxy (#226)

2.23.0 / 2017-07-18
==================

  * test: skip test.webdav.org test cases
  * feat: add defaultArgs on HttpClient

2.22.0 / 2017-04-10
==================

  * feat: add options.nestedQuerystring (#254)

2.21.2 / 2017-03-19
==================

  * fix: don't listen response aborted on node > 0.12 (#252)

2.21.1 / 2017-03-16
==================

  * fix: throw when write to stream timeout (#251)

2.21.0 / 2017-02-27
==================

  * fix: should pass options to httpclient2 (#249)
  * test: fix Promise not defined on 0.10
  * test: use assert instead of should
  * feat: add retry delay on httpclient2

2.20.0 / 2017-02-06
==================

  * deps: bump deps versions
  * fix: keep the same req object across request and response event

2.19.0 / 2016-12-14
==================

  * feat: add `dataAsQueryString` params for convert data to query string (#240)

2.18.0 / 2016-12-07
==================

  * fix: use nextTick to prevent promise handling error.
  * refactor: move to separated files
  * feat: add retry option

2.17.1 / 2016-11-25
==================

  * add environment detection for connect timer, because no socket event in browser env (#236)

2.17.0 / 2016-10-13
==================

  * feat: add -2 status for connect timeout (#224)

2.16.1 / 2016-10-10
==================

  * fix: parse content-type (#221)

2.16.0 / 2016-09-27
==================

  * feat: add custom dns lookup function (#220)

2.15.1 / 2016-09-26
==================

  * fix: httpclient support set agent to false (#219)

2.15.0 / 2016-09-21
==================

  * feat: export remoteAddress and remotePort (#216)

2.14.0 / 2016-09-19
==================

  * feat: allow user to rewrite redirect url (#214)

2.13.2 / 2016-09-18
==================

  * fix: response size should use last one (#213)

2.13.1 / 2016-09-10
==================

  * fix: add missing ctx on request event (#210)

2.13.0 / 2016-08-09
==================

  * feat: timing (#204)
  * docs: fix res.aborted description

2.12.0 / 2016-08-08
==================

  * feat: support connect and response timeouts (#201)

2.11.1 / 2016-08-04
==================

  * fix: catch http.request sync error (#199)

2.11.0 / 2016-06-26
==================

  * deps: upgrade deps from ~ to ^ (#189)

2.10.0 / 2016-06-21
==================

  * feat: add an options consumeWriteStream (#187)
  * chore(package): update statuses to version 1.3.0 (#174)

2.9.1 / 2016-05-09
==================

  * fix: check url before request (#172)
  * chore(package): update any-promise to version 1.2.0 (#171)

2.9.0 / 2016-04-21
==================

  * feat: log all requested urls (#169)
  * deps: agentkeepalive@2.1.1

2.8.0 / 2016-02-27
==================

  * test: improve coverage
  * feat: http default protocol for URL argument

2.7.3 / 2016-02-27
==================

  * deps: upgrade out of date deps

2.7.2 / 2016-02-25
==================

  * test: support windows
  * fix: keep headers.Host on `location: /foo` redirect
  * test: use npmjs.com on travis ci
  * fix: jshint style
  * deps: any-promise instead of native-or-blubird

2.7.1 / 2016-02-02
==================

  * fix: clean up headers.Host before redirect request start
  * chore: update authors

2.7.0 / 2016-01-14
==================

  * feat: response event include data property
  * chore: Add host info into debug

2.6.0 / 2015-12-09
==================

 * test: fix unstable test cases
 * feat: enhance global events
 * chore(package): update semver to version 5.1.0
 * chore(package): update should to version 7.1.1

2.5.0 / 2015-09-30
==================

 * test: fix test url
 * feat: remove request# in error message
 * test: add streaming upload test
 * test: use codecov.io

2.4.0 / 2015-08-20
==================

 * feat: add options.fixJSONCtlChars to fix JSON control characters
 * Fix a typo in comment

2.3.11 / 2015-08-12
==================

 * fix: httpclient support curl too

2.3.10 / 2015-08-12
==================

 * fix: add alias urllib.curl()
 * chore: add decodeBodyByCharset error debug log

2.3.9 / 2015-07-23
==================

 * feat: show json format data when json parse error

2.3.8 / 2015-06-06
==================

 * fix: need to clear timer after follow redirect

2.3.7 / 2015-06-04
==================

 * test: use cnpmjs.org instead of taobao.com
 * fix: need to resume res before next redirect request start

2.3.6 / 2015-06-03
==================

 * fix: support 303, 305, 307 redirect status code

2.3.5 / 2015-05-11
==================

 * fix: followRedirect support customResponse.

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
