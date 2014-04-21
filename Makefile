TESTS = test/*.test.js
REPORTER = spec
TIMEOUT = 20000
MOCHA_OPTS =

install:
	@npm install --registry=http://registry.cnpmjs.org --disturl=http://dist.cnpmjs.org

jshint: install
	@./node_modules/.bin/jshint .

test: install
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov cov:
	@NODE_ENV=test node --harmony \
		node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha \
		-- -u exports \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)
	@-$(MAKE) check-coverage

check-coverage:
	@./node_modules/.bin/istanbul check-coverage \
		--statements 96 \
		--branches 93 \
		--functions 94 \
		--lines 96

test-all: jshint test test-cov

autod: install
	@./node_modules/.bin/autod -w
	@$(MAKE) install

.PHONY: test
