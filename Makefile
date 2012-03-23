SRC = $(shell find lib -type f -name "*.js")
TESTS = test/*.js
TESTTIMEOUT = 5000
REPORTER = spec

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) --timeout $(TESTTIMEOUT) $(TESTS)

cov:
	@JSCOV=1 ./node_modules/mocha/bin/mocha \
		--reporter html-cov --timeout ${TESTTIMEOUT} ${TESTS} > coverage.html

.PHONY: test
