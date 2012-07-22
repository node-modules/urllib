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
	@$(MAKE) lib-cov
	@URLLIB_COV=1 $(MAKE) test REPORTER=dot
	@URLLIB_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@jscoverage lib $@

.PHONY: lib-cov test test-cov