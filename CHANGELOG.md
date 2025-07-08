# Changelog

## [4.8.0](https://github.com/node-modules/urllib/compare/v4.7.1...v4.8.0) (2025-07-08)


### Features

* add isSentByFetch/fetchOpaque to urllib message ([#581](https://github.com/node-modules/urllib/issues/581)) ([d7e9f40](https://github.com/node-modules/urllib/commit/d7e9f40504dabdedeaf9081fc3a5015e545aba45))

## [4.7.1](https://github.com/node-modules/urllib/compare/v4.7.0...v4.7.1) (2025-07-07)


### Bug Fixes

* compatible with urllib@2 timeout string format ([#580](https://github.com/node-modules/urllib/issues/580)) ([5eaf790](https://github.com/node-modules/urllib/commit/5eaf790d89b9ffebbadbc079ef9926b91f6130fd))

## [4.7.0](https://github.com/node-modules/urllib/compare/v4.6.12...v4.7.0) (2025-07-03)


### Features

* support multiple fetch_factory instances ([#579](https://github.com/node-modules/urllib/issues/579)) ([d09d316](https://github.com/node-modules/urllib/commit/d09d3166b431874dc513d975bfd73a83671edf2a))

## [4.6.12](https://github.com/node-modules/urllib/compare/v4.6.11...v4.6.12) (2025-06-28)


### Bug Fixes

* compatible with pool stats reading ([#578](https://github.com/node-modules/urllib/issues/578)) ([13a29af](https://github.com/node-modules/urllib/commit/13a29af659ed3fb9f0c924a80ae7d760c1997f55))

## [4.6.11](https://github.com/node-modules/urllib/compare/v4.6.10...v4.6.11) (2024-12-20)


### Bug Fixes

* compressed option should be false by default ([#567](https://github.com/node-modules/urllib/issues/567)) ([a0a8dc5](https://github.com/node-modules/urllib/commit/a0a8dc565ed5fcbe21c8a8e4e07d6bb51b185c96))

## [4.6.10](https://github.com/node-modules/urllib/compare/v4.6.9...v4.6.10) (2024-12-19)


### Bug Fixes

* should HEAD request keepalive by default ([#566](https://github.com/node-modules/urllib/issues/566)) ([54c4a2c](https://github.com/node-modules/urllib/commit/54c4a2cc3950e091ef7bdbd0f1cfa3a0c032f6e6))

## [4.6.9](https://github.com/node-modules/urllib/compare/v4.6.8...v4.6.9) (2024-12-17)


### Bug Fixes

* should got undici:client:sendHeaders message on H2 ([#553](https://github.com/node-modules/urllib/issues/553)) ([bd19f6d](https://github.com/node-modules/urllib/commit/bd19f6d9e6b845ca0d31c1c7a77d744dfa87f894))

## [4.6.8](https://github.com/node-modules/urllib/compare/v4.6.7...v4.6.8) (2024-12-11)


### Bug Fixes

* patch TransformStream on Node.js 16 ([#564](https://github.com/node-modules/urllib/issues/564)) ([503dbd8](https://github.com/node-modules/urllib/commit/503dbd8908320d4aa468c058221eb286f3df3cf2))

## [4.6.7](https://github.com/node-modules/urllib/compare/v4.6.6...v4.6.7) (2024-12-11)


### Bug Fixes

* should not throw when fetch a Request with post ([#563](https://github.com/node-modules/urllib/issues/563)) ([6f9f353](https://github.com/node-modules/urllib/commit/6f9f353c57cd5327b1a00564774830eac29cbcbd))

## [4.6.6](https://github.com/node-modules/urllib/compare/v4.6.5...v4.6.6) (2024-12-07)


### Bug Fixes

* allow set rejectUnauthorized = true on urllib.request options ([#561](https://github.com/node-modules/urllib/issues/561)) ([88785e1](https://github.com/node-modules/urllib/commit/88785e16560f60989f388f2a4354f076693d2876))

## [4.6.5](https://github.com/node-modules/urllib/compare/v4.6.4...v4.6.5) (2024-12-07)


### Bug Fixes

* set opaque on request ([#560](https://github.com/node-modules/urllib/issues/560)) ([8cf5c3b](https://github.com/node-modules/urllib/commit/8cf5c3ba50eee03f6363ad68416db8ef618adffd))

## [4.6.4](https://github.com/node-modules/urllib/compare/v4.6.3...v4.6.4) (2024-12-06)


### Bug Fixes

* export WebFormData ([#559](https://github.com/node-modules/urllib/issues/559)) ([dec6b12](https://github.com/node-modules/urllib/commit/dec6b1248ef68c1679f3d7f32c5544655e726045))

## [4.6.3](https://github.com/node-modules/urllib/compare/v4.6.2...v4.6.3) (2024-12-05)


### Bug Fixes

* only set extend notation on non-ascii filename ([#558](https://github.com/node-modules/urllib/issues/558)) ([0cd9b06](https://github.com/node-modules/urllib/commit/0cd9b06031eb5bed08677b6503a8a0fba4ac7fd8))

## [4.6.2](https://github.com/node-modules/urllib/compare/v4.6.1...v4.6.2) (2024-12-04)


### Bug Fixes

* fix socket info if fetch failed ([#556](https://github.com/node-modules/urllib/issues/556)) ([e9f4258](https://github.com/node-modules/urllib/commit/e9f425885aaa51258180048c5178d62af6da91d3))

## [4.6.1](https://github.com/node-modules/urllib/compare/v4.6.0...v4.6.1) (2024-12-04)


### Bug Fixes

* fix socket info in response ([#555](https://github.com/node-modules/urllib/issues/555)) ([629c7a3](https://github.com/node-modules/urllib/commit/629c7a304998f921b5a9678808be3f28ac267f81))

## [4.6.0](https://github.com/node-modules/urllib/compare/v4.5.1...v4.6.0) (2024-12-04)


### Features

* exports undici ([#554](https://github.com/node-modules/urllib/issues/554)) ([3c9fca7](https://github.com/node-modules/urllib/commit/3c9fca7c339753fa6d6430fb5659e6d11fc20997))

## [4.5.1](https://github.com/node-modules/urllib/compare/v4.5.0...v4.5.1) (2024-12-02)


### Bug Fixes

* support use on Node.js 16 ([#550](https://github.com/node-modules/urllib/issues/550)) ([78e1336](https://github.com/node-modules/urllib/commit/78e1336997dc0f86b8e7da98f572753da0de91cb))

## [4.5.0](https://github.com/node-modules/urllib/compare/v4.4.0...v4.5.0) (2024-11-30)


### Features

* upgrade to undici v7 ([#547](https://github.com/node-modules/urllib/issues/547)) ([9803c4e](https://github.com/node-modules/urllib/commit/9803c4e1fda2b56a7540eb45dde57caf25f969d6))

## [4.4.0](https://github.com/node-modules/urllib/compare/v4.3.1...v4.4.0) (2024-10-08)


### Features

* impl fetch ([#542](https://github.com/node-modules/urllib/issues/542)) ([55a634c](https://github.com/node-modules/urllib/commit/55a634c1784365f35ab69139549b47d24f500069))

## [4.3.1](https://github.com/node-modules/urllib/compare/v4.3.0...v4.3.1) (2024-09-19)


### Bug Fixes

* add export type ([#540](https://github.com/node-modules/urllib/issues/540)) ([1765806](https://github.com/node-modules/urllib/commit/1765806792c7aaf91c6095fa45e37ca98ede9496))

## [4.3.0](https://github.com/node-modules/urllib/compare/v4.2.2...v4.3.0) (2024-09-14)


### Features

* Added support for x-www-authenticate header ([#533](https://github.com/node-modules/urllib/issues/533)) ([d52a3e0](https://github.com/node-modules/urllib/commit/d52a3e0b32db305e7839af2aa8464201319c0504))

## [4.2.2](https://github.com/node-modules/urllib/compare/v4.2.1...v4.2.2) (2024-09-14)


### Bug Fixes

* uncaught exception due to second response with digest auth ([#530](https://github.com/node-modules/urllib/issues/530)) ([9a7833e](https://github.com/node-modules/urllib/commit/9a7833e17b07c696feb4a0a32476a01c3156b7ae))

## [4.2.1](https://github.com/node-modules/urllib/compare/v4.2.0...v4.2.1) (2024-09-11)


### Bug Fixes

* allow ":" character in digestAuth password ([#532](https://github.com/node-modules/urllib/issues/532)) ([c6b6f88](https://github.com/node-modules/urllib/commit/c6b6f881bb1f33fc944482d9060d3576788c7c74))

## [4.2.0](https://github.com/node-modules/urllib/compare/v4.1.0...v4.2.0) (2024-07-08)


### Features

* add hostname for checkAddress ([#525](https://github.com/node-modules/urllib/issues/525)) ([88b6e56](https://github.com/node-modules/urllib/commit/88b6e56a02988a0887f095c2ac5f0308cdf6e9c0))

## [4.1.0](https://github.com/node-modules/urllib/compare/v4.0.0...v4.1.0) (2024-06-27)


### Features

* support HTTP2 ([#518](https://github.com/node-modules/urllib/issues/518)) ([21d4260](https://github.com/node-modules/urllib/commit/21d4260410ca7ca53bc60af34a2f86dc9b4f8e8a))

## [4.0.0](https://github.com/node-modules/urllib/compare/v3.25.1...v4.0.0) (2024-06-23)


### ⚠ BREAKING CHANGES

* drop Node.js < 18.19.0 support

part of https://github.com/eggjs/egg/issues/3644

<!-- This is an auto-generated comment: release notes by coderabbit.ai
-->

## Summary by CodeRabbit

- **New Features**
	- Updated dynamic badge for contributors in `README.md`.
	- Enhanced form data handling in `HttpClient`.

- **Bug Fixes**
	- Improved error handling and performance tracking in `Socket` methods.
	- Adjusted imports for better compatibility and error handling.

- **Refactor**
	- Updated Node.js versions in CI workflow.
- Revised `exports` and `scripts` in `package.json` for better
consistency.
	- Simplified `subscribe` function in diagnostics channel.

- **Chores**
	- Removed outdated configurations from `.eslintrc`.
	- Updated TypeScript compiler options in `tsconfig.json`.

- **Documentation**
	- Linked license section to `contributors-img` in `README.md`.

- **Tests**
- Refined import paths and added new imports for better error handling
in test files.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->

### Features

* use undici v6 ([#514](https://github.com/node-modules/urllib/issues/514)) ([989d228](https://github.com/node-modules/urllib/commit/989d2280e3d6cec0902a32560dbf7a8a0a307043))

## [3.25.1](https://github.com/node-modules/urllib/compare/v3.25.0...v3.25.1) (2024-06-01)


### Bug Fixes

* adpater http/2 agent on diagnosticsChannel ([#511](https://github.com/node-modules/urllib/issues/511)) ([d565da2](https://github.com/node-modules/urllib/commit/d565da230bb5be0714e1fcaf36db2f30844c29f2))

## [3.25.0](https://github.com/node-modules/urllib/compare/v3.24.0...v3.25.0) (2024-05-07)


### Features

* support custom filename when file is Buffer or Readable  ([#508](https://github.com/node-modules/urllib/issues/508)) ([032f439](https://github.com/node-modules/urllib/commit/032f439224378696ba38e2a129ca9603733eae9d))

## [3.24.0](https://github.com/node-modules/urllib/compare/v3.23.0...v3.24.0) (2024-04-22)


### Features

* show debug log on response stage ([#506](https://github.com/node-modules/urllib/issues/506)) ([ec18131](https://github.com/node-modules/urllib/commit/ec18131542018903f440e9b59ccb450532aa3cb8))

## [3.23.0](https://github.com/node-modules/urllib/compare/v3.22.5...v3.23.0) (2024-03-09)


### Features

* support AbortController ([#493](https://github.com/node-modules/urllib/issues/493)) ([b81bbbb](https://github.com/node-modules/urllib/commit/b81bbbbbdc89dbaecd2d48396621ca8061da2226))

## [3.22.5](https://github.com/node-modules/urllib/compare/v3.22.4...v3.22.5) (2024-02-29)


### Bug Fixes

* keep statusMessage alias to statusText on response.res object ([#491](https://github.com/node-modules/urllib/issues/491)) ([5773b07](https://github.com/node-modules/urllib/commit/5773b077ce90ac2d40110765f579424ea5f8fffa))

## [3.22.4](https://github.com/node-modules/urllib/compare/v3.22.3...v3.22.4) (2024-02-22)


### Bug Fixes

* options.method alias options.type is invalid ([#490](https://github.com/node-modules/urllib/issues/490)) ([75c5989](https://github.com/node-modules/urllib/commit/75c5989f5a267ed0f6505ba877d66748d7bd5e36))

## [3.22.3](https://github.com/node-modules/urllib/compare/v3.22.2...v3.22.3) (2024-02-20)


### Bug Fixes

* use querystring to stringify data ([#489](https://github.com/node-modules/urllib/issues/489)) ([ee9a786](https://github.com/node-modules/urllib/commit/ee9a786045f0cebb00ad757b5507d9730ec9c839))

## [3.22.2](https://github.com/node-modules/urllib/compare/v3.22.1...v3.22.2) (2024-01-15)


### Bug Fixes

* try to read opaque from handler property ([#485](https://github.com/node-modules/urllib/issues/485)) ([5d543d9](https://github.com/node-modules/urllib/commit/5d543d95763596c33861a414a058569a1f25b4fb))

## [3.22.1](https://github.com/node-modules/urllib/compare/v3.22.0...v3.22.1) (2023-12-22)


### Bug Fixes

* make sure kClients exists on Agent ([#482](https://github.com/node-modules/urllib/issues/482)) ([574bd47](https://github.com/node-modules/urllib/commit/574bd47e277560094202ecc6925160a8eb38f0a6))

## [3.22.0](https://github.com/node-modules/urllib/compare/v3.21.0...v3.22.0) (2023-12-21)


### Features

* export agent pool stats ([#481](https://github.com/node-modules/urllib/issues/481)) ([5f9be29](https://github.com/node-modules/urllib/commit/5f9be2931a143d4414b9ae0e83d7be9a015d8bd7))

## [3.21.0](https://github.com/node-modules/urllib/compare/v3.20.0...v3.21.0) (2023-12-04)


### Features

* print more socket info on UND_ERR_CONNECT_TIMEOUT error ([#477](https://github.com/node-modules/urllib/issues/477)) ([366de1d](https://github.com/node-modules/urllib/commit/366de1df2ecdef71bcc927000f346d0cd08fe4cb))

## [3.20.0](https://github.com/node-modules/urllib/compare/v3.19.3...v3.20.0) (2023-12-04)


### Features

* allow to set client connect timeout ([#476](https://github.com/node-modules/urllib/issues/476)) ([fde0d23](https://github.com/node-modules/urllib/commit/fde0d23cb8fd19b9ccc36ce1bdc3ec93392d48b8))

## [3.19.3](https://github.com/node-modules/urllib/compare/v3.19.2...v3.19.3) (2023-09-21)


### Bug Fixes

* Don't mutate passed URL object ([#470](https://github.com/node-modules/urllib/issues/470)) ([5b8867f](https://github.com/node-modules/urllib/commit/5b8867fb131df811181470aeb8fb8b68989a7751))

## [3.19.2](https://github.com/node-modules/urllib/compare/v3.19.1...v3.19.2) (2023-09-19)


### Bug Fixes

* change `set-cookie` type define to `string | string[]` ([#471](https://github.com/node-modules/urllib/issues/471)) ([674915a](https://github.com/node-modules/urllib/commit/674915a2be7b3101c58532f48ca750974b872996))

## [3.19.1](https://github.com/node-modules/urllib/compare/v3.19.0...v3.19.1) (2023-09-17)


### Bug Fixes

* use types instead of typings ([#469](https://github.com/node-modules/urllib/issues/469)) ([8c4ec6c](https://github.com/node-modules/urllib/commit/8c4ec6c58935333aabe4b92ca86504c1491e72d9))

## [3.19.0](https://github.com/node-modules/urllib/compare/v3.18.1...v3.19.0) (2023-09-14)


### Features

* use tshy to support commonjs and esm both ([#468](https://github.com/node-modules/urllib/issues/468)) ([b2576c0](https://github.com/node-modules/urllib/commit/b2576c0c1f41450cc39d4aad30d76f49140a0478))

## [3.18.1](https://github.com/node-modules/urllib/compare/v3.18.0...v3.18.1) (2023-09-11)


### Bug Fixes

* allow type export on mts ([#465](https://github.com/node-modules/urllib/issues/465)) ([166403f](https://github.com/node-modules/urllib/commit/166403f06506b7e1a71fcabe6721161b71b26ade))

## [3.18.0](https://github.com/node-modules/urllib/compare/v3.17.2...v3.18.0) (2023-08-18)


### Features

* support nestedQuerystring as urllib v2 ([#462](https://github.com/node-modules/urllib/issues/462)) ([0f4abff](https://github.com/node-modules/urllib/commit/0f4abff96e6038abc7d86dd66e87a46a5529b1f2))

## [3.17.2](https://github.com/node-modules/urllib/compare/v3.17.1...v3.17.2) (2023-08-17)


### Bug Fixes

* check writeStream destroyed before send request ([#460](https://github.com/node-modules/urllib/issues/460)) ([78515b9](https://github.com/node-modules/urllib/commit/78515b9ec0b12b191eaefc298fd30674efc51415))

## [3.17.1](https://github.com/node-modules/urllib/compare/v3.17.0...v3.17.1) (2023-06-15)


### Bug Fixes

* set `socketErrorRetry = 1` by default ([#455](https://github.com/node-modules/urllib/issues/455)) ([1d26bb8](https://github.com/node-modules/urllib/commit/1d26bb8c2996d44a21611d3d716eb38f62570ce4))

## [3.17.0](https://github.com/node-modules/urllib/compare/v3.16.1...v3.17.0) (2023-06-15)


### Features

* support tracing on diagnostics_channel ([#452](https://github.com/node-modules/urllib/issues/452)) ([416b2ca](https://github.com/node-modules/urllib/commit/416b2cab086e09b7423891b3302b04ed614ec144))

## [3.16.1](https://github.com/node-modules/urllib/compare/v3.16.0...v3.16.1) (2023-05-24)


### Bug Fixes

* support request uds and tcp at the same time ([#451](https://github.com/node-modules/urllib/issues/451)) ([3583219](https://github.com/node-modules/urllib/commit/358321962bf80e0859c2cc8fa3d35fa2dd6b2e98))

## [3.16.0](https://github.com/node-modules/urllib/compare/v3.15.0...v3.16.0) (2023-05-21)


### Features

* support custom highWaterMark ([#450](https://github.com/node-modules/urllib/issues/450)) ([a324eeb](https://github.com/node-modules/urllib/commit/a324eebfe78181f58fde1a22c8b93100269e631b))

## [3.15.0](https://github.com/node-modules/urllib/compare/v3.14.1...v3.15.0) (2023-05-21)


### Features

* auto update USER_AGENT version to urllib package.version ([#449](https://github.com/node-modules/urllib/issues/449)) ([d4e5f39](https://github.com/node-modules/urllib/commit/d4e5f399181c79e848ee5f765712ee1d72bccb6d))

## [3.14.1](https://github.com/node-modules/urllib/compare/v3.14.0...v3.14.1) (2023-05-17)


### Bug Fixes

* upgrade undici to latest version ([#448](https://github.com/node-modules/urllib/issues/448)) ([c240067](https://github.com/node-modules/urllib/commit/c2400676e80158bba65a88f72e20499589110ec5))

## [3.14.0](https://github.com/node-modules/urllib/compare/v3.13.2...v3.14.0) (2023-05-07)


### Features

* support Node.js 20 ([#444](https://github.com/node-modules/urllib/issues/444)) ([83accbe](https://github.com/node-modules/urllib/commit/83accbe2cd2392b4ec844a27d1b384b0a7924f77))

## [3.13.2](https://github.com/node-modules/urllib/compare/v3.13.1...v3.13.2) (2023-04-24)


### Bug Fixes

* force use undici@~5.21.2 to fix content-length error ([#445](https://github.com/node-modules/urllib/issues/445)) ([331ed7e](https://github.com/node-modules/urllib/commit/331ed7e7e3c5bb1215c225e75e3fa007196a9fd2))

## [3.13.1](https://github.com/node-modules/urllib/compare/v3.13.0...v3.13.1) (2023-03-25)


### Bug Fixes

* ignore undefined value data on GET query ([#441](https://github.com/node-modules/urllib/issues/441)) ([f40ce0a](https://github.com/node-modules/urllib/commit/f40ce0a2eb415528d32c684ff2ec073930b24402))

## [3.13.0](https://github.com/node-modules/urllib/compare/v3.12.0...v3.13.0) (2023-03-25)


### Features

* build target up to ES2022 ([#439](https://github.com/node-modules/urllib/issues/439)) ([95a51ce](https://github.com/node-modules/urllib/commit/95a51ce4a1b73ae5f16da14f67043cb9dd921fe6))

## [3.12.0](https://github.com/node-modules/urllib/compare/v3.11.0...v3.12.0) (2023-03-21)


### Features

* support reset to not reuse connection ([#438](https://github.com/node-modules/urllib/issues/438)) ([3e12703](https://github.com/node-modules/urllib/commit/3e1270395bf22aa2dbc12ae858e439debfbe03ae))

## [3.11.0](https://github.com/node-modules/urllib/compare/v3.10.2...v3.11.0) (2023-02-18)


### Features

* support statusText on response ([#434](https://github.com/node-modules/urllib/issues/434)) ([bda2231](https://github.com/node-modules/urllib/commit/bda2231cd455d13d0638ab02422d12fdde1daa5f))

## [3.10.2](https://github.com/node-modules/urllib/compare/v3.10.1...v3.10.2) (2023-02-13)


### Bug Fixes

* update undiciRequestOption ([#433](https://github.com/node-modules/urllib/issues/433)) ([45157e8](https://github.com/node-modules/urllib/commit/45157e8186a23ada7c035c61c97dd309d1fdad42))

## [3.10.1](https://github.com/node-modules/urllib/compare/v3.10.0...v3.10.1) (2023-01-14)


### Bug Fixes

* keep urllib2 request with Type parameter ([#432](https://github.com/node-modules/urllib/issues/432)) ([12f169e](https://github.com/node-modules/urllib/commit/12f169e18089682331710aee10fdc7fd6a0946d3))

## [3.10.0](https://github.com/node-modules/urllib/compare/v3.9.0...v3.10.0) (2022-12-18)


### Features

* ts compile target up to ES2020 ([#430](https://github.com/node-modules/urllib/issues/430)) ([566dabb](https://github.com/node-modules/urllib/commit/566dabb6fce23415a30fcddf6c91d0d1e9c89e82))

---

3.9.0 / 2022-12-17
==================

**features**
  * [[`c6928c4`](http://github.com/node-modules/urllib/commit/c6928c4e81eb235f6cb233dd986cba460ec6e1bd)] - 📦 NEW: Export HttpClientResponse from urllib directly (#427) (fengmk2 <<fengmk2@gmail.com>>)

3.8.1 / 2022-12-16
==================

**fixes**
  * [[`3c731cc`](http://github.com/node-modules/urllib/commit/3c731cc3a376f84d5d5d4b6af0b0b986891eac12)] - 🐛 FIX: HttpClientResponse.res should be IncomingMessage (#426) (fengmk2 <<fengmk2@gmail.com>>)

3.8.0 / 2022-12-14
==================

**features**
  * [[`ee75fe7`](http://github.com/node-modules/urllib/commit/ee75fe78063112ed62d840167cc1ec71a9c6ea21)] - 👌 IMPROVE: Keep more compatible d.ts on urllib v2 (#425) (fengmk2 <<fengmk2@gmail.com>>)

3.7.0 / 2022-12-06
==================

**features**
  * [[`726fe86`](http://github.com/node-modules/urllib/commit/726fe86e2c19a57336029ca87c0b962749368e64)] - 👌 IMPROVE: Support formstream module instance stream (#424) (fengmk2 <<fengmk2@gmail.com>>)

3.6.0 / 2022-12-05
==================

**features**
  * [[`53d2c91`](http://github.com/node-modules/urllib/commit/53d2c919b7d370a866581b3924b9349f5da3bf9f)] - 👌 IMPROVE: Support old style readable stream (#423) (fengmk2 <<fengmk2@gmail.com>>)

3.5.2 / 2022-11-25
==================

**fixes**
  * [[`6a9dd92`](http://github.com/node-modules/urllib/commit/6a9dd924fe1b09637c825868ce6dc5c6fc8be263)] - 🐛 FIX: Import undici types change (#422) (fengmk2 <<fengmk2@gmail.com>>)

3.5.1 / 2022-11-19
==================

**fixes**
  * [[`46d0515`](http://github.com/node-modules/urllib/commit/46d0515eab2e29026e58081bd0516692449c6722)] - fix: parsing multiple www-authenticate response headers (#421) (capsice <<108602490+capsice@users.noreply.github.com>>)

**others**
  * [[`5c0b4e9`](http://github.com/node-modules/urllib/commit/5c0b4e99ffc8b3ddf9ee40d1cd580f02a80bc712)] - test: use vitest skipIf api (#419) (Ke Wu <<gemwuu@163.com>>)

3.5.0 / 2022-10-31
==================

**features**
  * [[`6ad7a02`](http://github.com/node-modules/urllib/commit/6ad7a029e38f4011846365e852feacb169e4df14)] - feat: add socketPath support (#418) (Ke Wu <<gemwuu@163.com>>)

3.4.0 / 2022-10-29
==================

**features**
  * [[`20148f0`](http://github.com/node-modules/urllib/commit/20148f03860f7ce2fd98852a7eec583c0fc95bb9)] - 👌 IMPROVE: Upgrade digest-header to v1 (#417) (fengmk2 <<fengmk2@gmail.com>>)

**others**
  * [[`b097c56`](http://github.com/node-modules/urllib/commit/b097c567cadd1818ab961282b423c1072bddda71)] - 🤖 TEST: Add Node.js 19 ci runner (#416) (fengmk2 <<fengmk2@gmail.com>>)

3.3.1 / 2022-10-16
==================

**fixes**
  * [[`d5270f1`](http://github.com/node-modules/urllib/commit/d5270f1e95072ab8becdcce6570e90c2dfd680e5)] - 🐛 FIX: Only auto decompress response stream on args.compressed=true (#412) (fengmk2 <<fengmk2@gmail.com>>)

**others**
  * [[`d3f6809`](http://github.com/node-modules/urllib/commit/d3f680986f2fd0a5bd8419a8b249ca83a8a5c551)] - 📖 DOC: Fix typo on Arguments (fengmk2 <<fengmk2@gmail.com>>)
  * [[`b63eb51`](http://github.com/node-modules/urllib/commit/b63eb51f62fa9b375a69b5aae9d7c7029aeb1885)] - 🤖 TEST: Only show error on non-IllegalAddressError (fengmk2 <<fengmk2@gmail.com>>)
  * [[`c54c86a`](http://github.com/node-modules/urllib/commit/c54c86ae9deba6fdf2b0a020e12bf38fa656d427)] - 🤖 TEST: Fix address illegal test case (#409) (fengmk2 <<fengmk2@gmail.com>>)

3.3.0 / 2022-10-05
==================

**features**
  * [[`b483da3`](http://github.com/node-modules/urllib/commit/b483da3fb7e934bdea1cf23a9f00b59491a80145)] - 👌 IMPROVE: Support request with proxy agent (#408) (fengmk2 <<fengmk2@gmail.com>>)

3.2.3 / 2022-09-29
==================

**fixes**
  * [[`9575d29`](http://github.com/node-modules/urllib/commit/9575d29a7ca238a46de0c4d7d3e92617019cbf13)] - 🐛 FIX: Support urlObject for compatibility (#406) (fengmk2 <<fengmk2@gmail.com>>)

3.2.2 / 2022-09-28
==================

**fixes**
  * [[`5a3ca77`](http://github.com/node-modules/urllib/commit/5a3ca7728f32d53b460b17d55f2eb69ec6ea8a59)] - 🐛 FIX: Keep req.options on error response event (#405) (fengmk2 <<fengmk2@gmail.com>>)

3.2.1 / 2022-09-27
==================

**fixes**
  * [[`456c73b`](http://github.com/node-modules/urllib/commit/456c73b3dc02e1323cb8db99b60ffd191e5d7abb)] - 🐛 FIX: http default protocol for URL argument (#404) (fengmk2 <<fengmk2@gmail.com>>)

3.2.0 / 2022-09-26
==================

**others**
  * [[`315f4a0`](http://github.com/node-modules/urllib/commit/315f4a0bf69abc2b29247fcf1a606c44412a86f3)] - 📦 NEW: Support timing and socket info (#400) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`414692b`](http://github.com/node-modules/urllib/commit/414692b183fb205acfb163f8aef4f853ce1b97e1)] - 🧪️ TEST: Add diagnostics_channel test cases (#398) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`65abb60`](http://github.com/node-modules/urllib/commit/65abb6074e5098834dd964a2bedaffd64a703ef9)] - 🤖 TEST: Use vitest instead of jest (#399) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`5f0c4a8`](http://github.com/node-modules/urllib/commit/5f0c4a8da84ef9954942bcd78721a5445e0cb095)] - 📖 DOC: Update contributors (fengmk2 <<fengmk2@gmail.com>>)

3.1.3 / 2022-09-09
==================

**others**
  * [[`65c5112`](http://github.com/node-modules/urllib/commit/65c5112aaaa8a6b6a9e324b0522fe1635e3792ba)] - 🐛 FIX: Include query parameters in digest uri (#396) (Chris Byrne <<github@adapt.gen.nz>>)

3.1.2 / 2022-08-24
==================

**others**
  * [[`d1b89c8`](http://github.com/node-modules/urllib/commit/d1b89c8911358c4a192e89e85dabf197dcc87a87)] - 🐛 FIX: Keep statusCode on HttpClientResponse for compatibility (#392) (fengmk2 <<fengmk2@gmail.com>>)

3.1.1 / 2022-08-23
==================

**others**
  * [[`e29fd00`](http://github.com/node-modules/urllib/commit/e29fd0069796f6733940f0cd98b8f3a26ea230dc)] - 🐛 FIX: Alias reqMeta.options to reqMeta.args (#391) (fengmk2 <<fengmk2@gmail.com>>)

3.1.0 / 2022-08-01
==================

**others**
  * [[`d5a0e66`](http://github.com/node-modules/urllib/commit/d5a0e664ac9d63d1a812a5af5daddacdc8e94134)] - 📦 NEW: Support digest auth (#390) (fengmk2 <<fengmk2@gmail.com>>)

3.0.4 / 2022-07-18
==================

**others**
  * [[`b730bbd`](http://github.com/node-modules/urllib/commit/b730bbd003ec68397b5a56e5d8f83bf8c6f1dc98)] - 🐛 FIX: Should deps tslib (#389) (fengmk2 <<fengmk2@gmail.com>>)

3.0.3 / 2022-07-17
==================

**others**
  * [[`d101f13`](http://github.com/node-modules/urllib/commit/d101f13956709dec0442220e1dec70990cd9b127)] - 🐛 FIX: export getGlobalDispatcher (#387) (fengmk2 <<fengmk2@gmail.com>>)

3.0.2 / 2022-07-17
==================

**others**
  * [[`3bc7461`](http://github.com/node-modules/urllib/commit/3bc74610eba9dfac4b5ab7b1c2e927cafacdaa9f)] - 📦 NEW: Enable Mocking request from undici (#386) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`2ef38b9`](http://github.com/node-modules/urllib/commit/2ef38b9a373428e109a2a813b11cdb5fd8e61446)] - 📖 DOC: Change History (fengmk2 <<fengmk2@gmail.com>>)

3.0.1 / 2022-07-17
==================

**others**
  * [[`a16deb5`](http://github.com/node-modules/urllib/commit/a16deb5923d55d145d29099073d9a3ccde07eeaf)] - 🐛 FIX: should export USER_AGENT (#385) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`122d4a6`](http://github.com/node-modules/urllib/commit/122d4a6fc98ebe6b59b3c2cf386c180785fb4a5b)] - 📖 DOC: Add Benchmarks result (fengmk2 <<fengmk2@gmail.com>>)

3.0.0 / 2022-07-16
==================

**others**
  * [[`20944ee`](http://github.com/node-modules/urllib/commit/20944ee71789297db4a4f82065ddc9eeca2f94e9)] - 📦 NEW: Support request and response events (fengmk2 <<fengmk2@gmail.com>>)
  * [[`f01c264`](http://github.com/node-modules/urllib/commit/f01c26439f9bd7ca5beb3e4b4d46ce5709dfb3c6)] - 📦 NEW: Support HttpClient with rejectUnauthorized (fengmk2 <<fengmk2@gmail.com>>)
  * [[`61a915c`](http://github.com/node-modules/urllib/commit/61a915c29f9b876966c01b8fad0175906d00d178)] - 📦 NEW: Support options.auth (fengmk2 <<fengmk2@gmail.com>>)
  * [[`cb084d9`](http://github.com/node-modules/urllib/commit/cb084d97031b6d67dc2ca3127a4f26359986bb6f)] - 📦 NEW: Support custom lookup and checkAddress (fengmk2 <<fengmk2@gmail.com>>)
  * [[`cc1c854`](http://github.com/node-modules/urllib/commit/cc1c854f45bc5e48716ffca650d1e58385fe24eb)] - 📦 NEW: Support options.opaque = object (fengmk2 <<fengmk2@gmail.com>>)
  * [[`f07c9f8`](http://github.com/node-modules/urllib/commit/f07c9f86a909d1555c7f29398ad05216112d4299)] - 📦 NEW: Support options.timing = true (fengmk2 <<fengmk2@gmail.com>>)
  * [[`70a75c6`](http://github.com/node-modules/urllib/commit/70a75c6bc8200286d2f6a183c52b95fb76fb05ba)] - 📦 NEW: Support options.compressed instead of gzip (fengmk2 <<fengmk2@gmail.com>>)
  * [[`936bc01`](http://github.com/node-modules/urllib/commit/936bc01cf0418d642af91bfe8c1e0c38c0b1a5a4)] - 👌 IMPROVE: Support Node.js 14 (fengmk2 <<fengmk2@gmail.com>>)
  * [[`eb6c319`](http://github.com/node-modules/urllib/commit/eb6c31950d295c019878edf066353bcbec007eed)] - 📦 NEW: Support auto retry like HttpClient2 (fengmk2 <<fengmk2@gmail.com>>)
  * [[`b07a45e`](http://github.com/node-modules/urllib/commit/b07a45ee9f33eca21f5aad1c24ca04b83cc1fdf9)] - 👌 IMPROVE: Use brotli instead of deflate (fengmk2 <<fengmk2@gmail.com>>)
  * [[`a8876f2`](http://github.com/node-modules/urllib/commit/a8876f268c434da9936f53e7264fa1ddb3a4ed24)] - 🤖 TEST: Big stream timeout (fengmk2 <<fengmk2@gmail.com>>)
  * [[`6b5a4f1`](http://github.com/node-modules/urllib/commit/6b5a4f19ac011666db292b5bdf3850e02ede39d2)] - 📦 NEW: Use request instead of fetch (fengmk2 <<fengmk2@gmail.com>>)
  * [[`c1218c5`](http://github.com/node-modules/urllib/commit/c1218c5da101e773346c99b735d3988be0b55560)] - 🐛 FIX: Try to use Readable first (fengmk2 <<fengmk2@gmail.com>>)
  * [[`a67d9d1`](http://github.com/node-modules/urllib/commit/a67d9d1dd7297111ac746b7d964c437cbf1b3e84)] - 🐛 FIX: Dont parse empty data to json (fengmk2 <<fengmk2@gmail.com>>)
  * [[`2882f0e`](http://github.com/node-modules/urllib/commit/2882f0eadca544bafb8e31de2fce9bd49438f3dd)] - 🤖 TEST: Error cases for stream and writeStream (fengmk2 <<fengmk2@gmail.com>>)
  * [[`57ccc7e`](http://github.com/node-modules/urllib/commit/57ccc7eda197dfe2a9a83e61bab3bb6a9c5bf11e)] - 📦 NEW: Support options.streaming = true (fengmk2 <<fengmk2@gmail.com>>)
  * [[`f2ca7eb`](http://github.com/node-modules/urllib/commit/f2ca7ebd406cc641959a6ecefb6c395aec9893a1)] - 📦 NEW: Support fixJSONCtlChars (fengmk2 <<fengmk2@gmail.com>>)
  * [[`f5390f2`](http://github.com/node-modules/urllib/commit/f5390f2a5b630238402d412e76d54035c0bfc7f3)] - 📦 NEW: TS compiler both Commonjs and ESM support (fengmk2 <<fengmk2@gmail.com>>)
  * [[`c3cc765`](http://github.com/node-modules/urllib/commit/c3cc76592e74bcebe793dd52a15dfe5823c65505)] - 📦 NEW: Support upload file by args.files (fengmk2 <<fengmk2@gmail.com>>)
  * [[`70a238d`](http://github.com/node-modules/urllib/commit/70a238de07170c6fdbac37d245bc72048d4435dd)] - 🤖 TEST: Use jest and ts (fengmk2 <<fengmk2@gmail.com>>)
  * [[`26c44b7`](http://github.com/node-modules/urllib/commit/26c44b75e7a6ac95dd0dd8853400f7d83d815f3b)] - 📦 NEW: [BREAKING] Refactor impl base on undici (fengmk2 <<fengmk2@gmail.com>>)

2.38.1 / 2022-07-05
==================

**fixes**
  * [[`f343daa`](http://github.com/node-modules/urllib/commit/f343daa6d1ffb91ebed00e0f858fcb4378921349)] - fix: ignore request error if request is done (#384) (killa <<killa123@126.com>>)

**others**
  * [[`518d22c`](http://github.com/node-modules/urllib/commit/518d22c30e3888e6cffec0572f05af0fc30f824f)] - Create codeql-analysis.yml (fengmk2 <<fengmk2@gmail.com>>)
  * [[`7daf2fa`](http://github.com/node-modules/urllib/commit/7daf2fa599ac294ffc8a3adfe7015b667f13e59a)] - chore: update contributors (fengmk2 <<fengmk2@gmail.com>>)
  * [[`20451f2`](http://github.com/node-modules/urllib/commit/20451f2898fba90a72c9b953e518e2f67a3bddd7)] - test: add tsd for timing interface (#377) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`f662c2b`](http://github.com/node-modules/urllib/commit/f662c2b066d3d4363491ee552a0976fe29a528cf)] - chore: update contributors (fengmk2 <<fengmk2@gmail.com>>)

2.38.0 / 2021-11-24
==================

**others**
  * [[`6d19f99`](http://github.com/node-modules/urllib/commit/6d19f99f6490df67832d1d2a9c39743c0de1cbd5)] - tsd: add timing interface (#375) (弘树@阿里 <<dickeylth@users.noreply.github.com>>)
  * [[`9c9c65b`](http://github.com/node-modules/urllib/commit/9c9c65b0e8344c1a30c157628a675440b8a616c1)] - test: check TypeScript type definitions (#373) (fengmk2 <<fengmk2@gmail.com>>)

2.37.4 / 2021-09-07
==================

**fixes**
  * [[`1e6622a`](http://github.com/node-modules/urllib/commit/1e6622a571b3e6f72c5f187a224bddedcbc382cf)] - fix: upgrade proxy-agent to fix the security vulnerability. (#368) (hyj1991 <<yeekwanvong@gmail.com>>)

**others**
  * [[`ae27498`](http://github.com/node-modules/urllib/commit/ae2749811e40262da8bf2641599b066344fa6b05)] - docs: notes contentType's value (#349) (changzhi <<changzhiwin@gmail.com>>)

2.37.3 / 2021-07-05
==================

**fixes**
  * [[`b730a6c`](http://github.com/node-modules/urllib/commit/b730a6cdc0465bea1c08d50bfa3b5e95bd17b31f)] - fix: 🐛 redirect status code (#363) (Hongcai Deng <<admin@dhchouse.com>>)

2.37.2 / 2021-06-07
==================

**fixes**
  * [[`04734a1`](http://github.com/node-modules/urllib/commit/04734a13e146da501f4e38333d5de9f9bbb259d1)] - fix: 🐛 should trigger response event when follow redirect (#361) (Hongcai Deng <<admin@dhchouse.com>>)

2.37.1 / 2021-04-15
==================

**others**
  * [[`d50afda`](http://github.com/node-modules/urllib/commit/d50afda91befff75f044a1ad83689f7a459c5d32)] - Update proxy-agent to v4 to resolve vulnerability (#355) (Chad McElligott <<chad.mcelligott@gmail.com>>)

2.37.0 / 2021-04-02
==================

**features**
  * [[`2acf75b`](http://github.com/node-modules/urllib/commit/2acf75b75050667f7341e6990078e0330e704af1)] - feat: add unix domain socket file support (#352) (Khaidi Chu <<i@2333.moe>>)

**others**
  * [[`f2a42d1`](http://github.com/node-modules/urllib/commit/f2a42d19d2236979c16eea13c229839e5a78b381)] - chore: LICENSE link typo (fengmk2 <<fengmk2@gmail.com>>)
  * [[`28a0152`](http://github.com/node-modules/urllib/commit/28a0152c0ae5d4470d88b8122724b6228b48b319)] - chore: update contributors (fengmk2 <<fengmk2@gmail.com>>)
  * [[`5674670`](http://github.com/node-modules/urllib/commit/56746704d61116d99846d94480d223a9e3c42913)] - test: add socket checker test case (#341) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`d953ec0`](http://github.com/node-modules/urllib/commit/d953ec0e55ec28d553a24c5cf0fcb64715e7c8f9)] - test: add testcase for using retry and writeStream in HttpClient2 (#350) (Haoliang Gao <<sakura9515@gmail.com>>)

2.36.1 / 2020-06-09
==================

**others**
  * [[`35eecc0`](http://github.com/node-modules/urllib/commit/35eecc021f55e324b2520f91a032a33517d94f29)] - chore: add type declaration for RequestOptions#keepHeaderCase (#345) (William <<willizm.cn@gmail.com>>)

2.36.0 / 2020-06-08
==================

**fixes**
  * [[`15c4170`](http://github.com/node-modules/urllib/commit/15c4170beab4404b0576caa01e199f445c476b7d)] - fix: allow to keep origin header key case (#344) (TZ | 天猪 <<atian25@qq.com>>)

**others**
  * [[`31c03b8`](http://github.com/node-modules/urllib/commit/31c03b853ae5db00c7223c0a1a545dfcf0b07aa5)] - chore: Update and rename LICENSE.txt to LICENSE (#343) (Yuxiang LIU <<david-khala@hotmail.com>>)

2.35.0 / 2020-05-15
==================

**features**
  * [[`47c21bd`](http://github.com/node-modules/urllib/commit/47c21bd93648080589bdc6528d9e9cf3e0489951)] - feat: change header to lowercase (#337) (TZ | 天猪 <<atian25@qq.com>>)

**fixes**
  * [[`8f2ca64`](http://github.com/node-modules/urllib/commit/8f2ca648608995d140d0ca3873ef728bdbd4ee41)] - fix: need to handle response data on close event (#340) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`175ad2b`](http://github.com/node-modules/urllib/commit/175ad2b3e17196626c701ef72396dd6932d14c7a)] - fix: res.socket is null in node-v14.x (#339) (hyj1991 <<yeekwanvong@gmail.com>>)

2.34.2 / 2019-12-09
==================

**fixes**
  * [[`67d5b1c`](http://github.com/node-modules/urllib/commit/67d5b1c35dc302778aa4b992ea4998fe427e3cc8)] - fix: index.d.ts (#334) (Daniels.Sun <<better.sunjian@gmail.com>>)

2.34.1 / 2019-09-02
==================

**fixes**
  * [[`3da9339`](http://github.com/node-modules/urllib/commit/3da9339aacf4aa59c17b40ff1793d320bc9d9f61)] - fix: rejectUnauthorized under Node.js 12 (#328) (Khaidi Chu <<i@2333.moe>>)

**others**
  * [[`061f600`](http://github.com/node-modules/urllib/commit/061f60075249c136b1ca7e1e2519dae25cb9e55d)] - test: add a test case for posting xml data to reflect #69 (#324) (Jeff <<jeff.tian@outlook.com>>)

2.34.0 / 2019-05-07
==================

**features**
  * [[`11f5d34`](http://github.com/node-modules/urllib/commit/11f5d34ea3d8aafbda4f3f5345d6dcfe7e20daa2)] - feat: support multipart/form-data by default (#322) (fengmk2 <<fengmk2@gmail.com>>)

**others**
  * [[`3c24781`](http://github.com/node-modules/urllib/commit/3c2478100f8490a0fd6f4c49772c682d38fcf43e)] - chore: update contributors (fengmk2 <<fengmk2@gmail.com>>)

2.33.4 / 2019-05-06
==================

**fixes**
  * [[`1f9566c`](http://github.com/node-modules/urllib/commit/1f9566c3dbb0be02e895647ced2d8eba06ce28aa)] - fix: don't parse URL on node 4 (#321) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`3384e53`](http://github.com/node-modules/urllib/commit/3384e53e8447a5cb06402a43d07d7eb19a24bb62)] - fix: normalize url with WHATWG URL to solve #319 (#320) (Chen Yangjian <<252317+cyjake@users.noreply.github.com>>)

2.33.3 / 2019-04-11
==================

**others**
  * [[`e08f71a`](http://github.com/node-modules/urllib/commit/e08f71af8c261318289d056260a156eca9d6a274)] - upgrade: proxy-agent@3.1.0 (#315) (薛定谔的猫 <<weiran.zsd@outlook.com>>)

2.33.2 / 2019-03-26
==================

**fixes**
  * [[`a2a8a1d`](http://github.com/node-modules/urllib/commit/a2a8a1de8088f1a1b6f96de9e9c2cee408bc165b)] - fix: only copy enumerable and ownProperty value of args.headers (#313) (fengmk2 <<fengmk2@gmail.com>>)

2.33.1 / 2019-03-21
==================

**fixes**
  * [[`f8091ce`](http://github.com/node-modules/urllib/commit/f8091ce41885178f4a1b50d6daf79a77bdead9f0)] - fix: cancel connect timer when done is called (Daniel Wang <<danielwpz@gmail.com>>)

2.33.0 / 2019-01-09
==================

**features**
  * [[`a5df9d5`](http://github.com/node-modules/urllib/commit/a5df9d5257a8d18dd0d71f7c76aff7f6464e9484)] - feat: add typescript definition (#308) (Haoliang Gao <<sakura9515@gmail.com>>)

**others**
  * [[`47ad864`](http://github.com/node-modules/urllib/commit/47ad864eba92a1e0f5a730adad6e8582af3fdbd8)] - test: add test case for streaming timeout (#307) (Yiyu He <<dead_horse@qq.com>>)

2.32.0 / 2019-01-07
==================

**features**
  * [[`a42445e`](http://github.com/node-modules/urllib/commit/a42445edfcaa17b9840afa8b4e06d1928d58ab53)] - feat: Expose status message from original Response (#306) (GP ✅ <<exchequer598@gmail.com>>)

2.31.3 / 2018-11-30
==================

**fixes**
  * [[`98a1622`](http://github.com/node-modules/urllib/commit/98a16225aa21b37c2bfbfe318fe1803eedbd2d0c)] - fix: ensure timeout error is handled when request with stream (#305) (Yiyu He <<dead_horse@qq.com>>)

**others**
  * [[`2bb86c0`](http://github.com/node-modules/urllib/commit/2bb86c0fe1f34cf8d12e397158e714a86f697093)] - test: only use junit report on azure-pipelines (#304) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`bd869c7`](http://github.com/node-modules/urllib/commit/bd869c704387d3159ca50bf1976c6c70358b3ee4)] - test: Publish test results to Azure Pipelines (#303) (Rishav Sharan <<rishav.sharan@microsoft.com>>)

2.31.2 / 2018-11-13
==================

**fixes**
  * [[`227618a`](http://github.com/node-modules/urllib/commit/227618ad0ceef68b409ba7ec9328bdcaba513b3e)] - fix: allow agent set to null (#301) (fengmk2 <<fengmk2@gmail.com>>)

2.31.1 / 2018-11-01
==================

**fixes**
  * [[`83fc316`](http://github.com/node-modules/urllib/commit/83fc3165aa477bd7b034c075ae133a52627fc12b)] - fix: Omit the 'Accept-Encoding' header if it is explicitly set to 'null' (#298) (GP ✅ <<exchequer598@gmail.com>>)
  * [[`36c24c3`](http://github.com/node-modules/urllib/commit/36c24c3f54b6115c178540803a9ffae733bba063)] - fix: should autofix socket timeout by request.timeout (#300) (fengmk2 <<fengmk2@gmail.com>>)

2.31.0 / 2018-10-24
==================

**features**
  * [[`28c38d2`](http://github.com/node-modules/urllib/commit/28c38d2451d85669decfdaf16ea07eaf958d41eb)] - feat: support agentkeepalive@4 (#297) (fengmk2 <<fengmk2@gmail.com>>)
  * [[`c79eefc`](http://github.com/node-modules/urllib/commit/c79eefc9843fb6a2aeb9e728ed4f8f912e8866ad)] - feat: Do not set User-Agent if the header is explicitly set to null (GP <<exchequer598@gmail.com>>)

2.30.0 / 2018-09-26
==================

**features**
  * [[`b760530`](http://github.com/node-modules/urllib/commit/b76053020923f4d99a1c93cf2e16e0c5ba10bacf)] - feat: implement trace option like mysql client (#290) (killa <<killa123@126.com>>)

**others**
  * [[`5e80ee8`](http://github.com/node-modules/urllib/commit/5e80ee8f3e8992da98b0a270de5a9298627841c7)] - test: run ci on azure-pipelines (#292) (azure-pipelines[bot] <<azure-pipelines[bot]@users.noreply.github.com>>)

2.29.1 / 2018-07-26
==================

**fixes**
  * [[`ab39245`](http://github.com/node-modules/urllib/commit/ab39245ecb8d75f56b559c193b26c4a19e7bbbfe)] - fix: keep exists accept header on dataType = json (#289) (fengmk2 <<fengmk2@gmail.com>>)

2.29.0 / 2018-07-03
==================

**features**
  * [[`4ca0c48`](http://github.com/node-modules/urllib/commit/4ca0c486699ff9e7e8b59f381a963a1133b59a96)] - feat: add socket handled request and response count (#288) (fengmk2 <<fengmk2@gmail.com>>)

2.28.1 / 2018-06-01
==================

**fixes**
  * [[`6bc31b9`](http://github.com/node-modules/urllib/commit/6bc31b9af77bbf5c4acab7e430116b071160b6d5)] - fix: use pump to close request stream (#287) (fengmk2 <<fengmk2@gmail.com>>)

**others**
  * [[`8087683`](http://github.com/node-modules/urllib/commit/8087683710118088891a580666b149181e1cab86)] - test: add node 10 support (#285) (fengmk2 <<fengmk2@gmail.com>>)

2.28.0 / 2018-05-25
==================

**features**
  * [[`c0221ff`](http://github.com/node-modules/urllib/commit/c0221ff08934519bacbcf96660f126d5d6279c02)] - feat: support deflate compress for response (#283) (iSayme <<isaymeorg@gmail.com>>)

**others**
  * [[`60ea1f6`](http://github.com/node-modules/urllib/commit/60ea1f653a29e0c8949fb3be5d82fe1fddf2a0f3)] - test: update url, the /:package/* not avalable anymore (#284) (iSayme <<isaymeorg@gmail.com>>)

2.27.0 / 2018-03-26
==================

**features**
  * [[`a6c93fd`](http://github.com/node-modules/urllib/commit/a6c93fd07e75e45c6eda09c732d0b72ff5dc9199)] - feat: support args.checkAddress (#279) (Yiyu He <<dead_horse@qq.com>>)

2.26.0 / 2018-02-28
==================

**features**
  * [[`d6e7c58`](http://github.com/node-modules/urllib/commit/d6e7c58b3688d415091ddc0c845b7cb8d57e20cc)] - feat: support Keep-Alive Header (#275) (fengmk2 <<fengmk2@gmail.com>>)

2.25.4 / 2018-01-18
==================

**fixes**
  * [[`9c496a0`](http://github.com/node-modules/urllib/commit/9c496a0510ee17f72129e1298cf310a8b1aee327)] - fix: Changed to "new (require('proxy-agent'))(proxy)" (#273) (Nick Ng <<nick-ng@users.noreply.github.com>>)

2.25.3 / 2017-12-29
==================

**fixes**
  * [[`e3df75e`](http://github.com/node-modules/urllib/commit/e3df75e249f67c943ac42d61abd1649291ba5f74)] - fix: res.requestUrls should be string array (#271) (hui <<kangpangpang@gmail.com>>)

2.25.2 / 2017-12-28
==================

**fixes**
  * [[`2df6906`](http://github.com/node-modules/urllib/commit/2df6906d188bc53aa2d24efa0d318e52cccf9d78)] - fix: make sure request event url should be a string (#270) (hui <<kangpangpang@gmail.com>>)

2.25.1 / 2017-10-20
==================

**fixes**
  * [[`ac9bc64`](http://github.com/node-modules/urllib/commit/ac9bc645149ffa5d9a1e8450ba00721a92d18f13)] - fix: don't change args.headers (#267) (fengmk2 <<fengmk2@gmail.com>>)

**others**
  * [[`b798546`](http://github.com/node-modules/urllib/commit/b798546ef240de7a4dbe8ba5feb05536a4912b1b)] - docs: fixed spelling mistake (#266) (Axes <<whxaxes@qq.com>>)

2.25.0 / 2017-09-08
==================

**features**
  * [[`95cabd6`](http://github.com/node-modules/urllib/commit/95cabd650ffb4996819570dea2518dea875d8452)] - feat: support custom fixJSONCtlChars function (#264) (fengmk2 <<fengmk2@gmail.com>>)

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
