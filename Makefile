TESTS = test/*.js
REPORTER = spec
TIMEOUT = 5000

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(TESTS)

test-cov:
	@rm -rf ./lib-cov
	@jscoverage lib lib-cov
	@URLLIB_COV=1 $(MAKE) test REPORTER=dot
	@URLLIB_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

.PHONY: test test-cov