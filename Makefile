TESTS = test/*.test.js
REPORTER = spec
TIMEOUT = 20000
JSCOVERAGE = ./node_modules/.bin/jscover

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(TESTS)

test-cov:
	@rm -rf ./lib-cov
	@$(JSCOVERAGE) lib lib-cov
	@URLLIB_COV=1 $(MAKE) test REPORTER=dot
	@URLLIB_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

.PHONY: test test-cov