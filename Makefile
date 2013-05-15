TESTS = test/*.test.js
REPORTER = spec
TIMEOUT = 20000
MOCHA_OPTS =

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov:
	@URLLIB_COV=1 $(MAKE) test MOCHA_OPTS='--require blanket' REPORTER=dot
	@URLLIB_COV=1 $(MAKE) test MOCHA_OPTS='--require blanket' REPORTER=html-cov > coverage.html

test-all: test
	@$(MAKE) test MOCHA_OPTS='--require blanket' REPORTER=travis-cov

.PHONY: test test-cov