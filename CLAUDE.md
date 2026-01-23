# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

urllib is a Node.js HTTP client library built on top of [undici](https://undici.nodejs.org/). It provides features like basic/digest authentication, redirections, timeout handling, gzip/brotli compression, file uploads, and HTTP/2 support.

## Common Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Run all tests
pnpm test

# Run a single test file
pnpm test test/options.timeout.test.ts

# Run tests matching a pattern
pnpm test -t "should timeout"

# Run tests with debug output
NODE_DEBUG=urllib:* pnpm test

# Lint code
pnpm run lint

# Format code
pnpm run fmt

# Type check
pnpm run typecheck

# Build the project (outputs to dist/)
pnpm run build

# Run benchmarks
pnpm run bench

# Run coverage
pnpm run cov
```

## Architecture

### Source Structure (`src/`)

- **index.ts** - Main entry point, exports `request()` and `curl()` functions with singleton HttpClient instances (cached by configuration: allowH2, rejectUnauthorized, socketPath)
- **HttpClient.ts** - Core class that wraps undici's request API. Handles request building, response processing, retries, redirects, digest auth, compression, timeouts, and diagnostics channel publishing
- **HttpAgent.ts** - Custom undici Agent with DNS lookup interception and SSRF protection via `checkAddress` callback
- **Request.ts** - TypeScript types for request options
- **Response.ts** - TypeScript types for response objects including timing info
- **fetch.ts** - Fetch API compatibility layer using HttpClient internally
- **FormData.ts** - FormData wrapper for multipart uploads
- **HttpClientError.ts** - Custom error classes (HttpClientConnectTimeoutError, HttpClientRequestTimeoutError)
- **diagnosticsChannel.ts** - Node.js diagnostics_channel integration for request/response tracing

### Build System

Uses [tshy](https://github.com/isaacs/tshy) to build dual ESM/CommonJS output:

- ESM output: `dist/esm/`
- CommonJS output: `dist/commonjs/`

The package exports both formats via conditional exports in package.json.

### Testing

Tests use Vitest with:

- Test files in `test/*.test.ts`
- Test fixtures in `test/fixtures/`
- Local HTTP server created in tests via `test/fixtures/server.ts`
- 60 second default timeout per test

## Key Implementation Details

- Default timeout is 5000ms for both headers and body
- Automatic retry on socket errors (configurable via `socketErrorRetry`)
- Request/response events published via `diagnostics_channel` (`urllib:request`, `urllib:response`)
- Streaming requests disable retry/redirect functionality
- User-Agent header: `node-urllib/{version} Node.js/{version} ({platform}; {arch})`

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a modern toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, and Oxfmt. Vite+ wraps these tools and package manager commands in a single, global CLI called `vite`. Vite+ is distinct from Vite, but it invokes Vite through `vite dev` and `vite build`.

## Vite+ Workflow

`vite` is a global binary that handles the full development lifecycle. Run `vite help` to print a list of commands and `vite <command> --help` for information about a specific command.

### Vite+ Commands

- dev - Run the development server
- build - Build for production
- lint - Lint code
- test - Run tests
- fmt - Format code
- lib - Build library
- new - Create a new monorepo package (in-project) or a new project (global)
- run - Run tasks from `package.json` scripts

These commands map to their corresponding tools. For example, `vite dev --port 3000` runs Vite's dev server and works the same as Vite. `vite test` runs JavaScript tests through the bundled Vitest. The versions of individual tools can be checked using `vite <command> --version`. For example, `vite lint --version` prints the bundled Oxlint version, and `vite test --version` prints the bundled Vitest version. This is useful when researching documentation, features, and bugs.

### Package Manager Commands

Vite+ automatically detects and wraps the underlying package manager such as pnpm, npm, or Yarn through the `packageManager` field in `package.json` or package manager-specific lockfiles.

- install - Install all dependencies, or add packages if package names are provided
- add - Add packages to dependencies
- remove - Remove packages from dependencies
- dlx - Execute a package binary without installing it as a dependency
- info - View package information from the registry, including latest versions
- link - Link packages for local development
- outdated - Check for outdated packages
- pm - Forward a command to the package manager
- unlink - Unlink packages
- update - Update packages to their latest versions
- why - Show why a package is installed

## Common Pitfalls

- **Using the package manager directly:** Do not use pnpm, npm, or Yarn directly. Vite+ can handle all package manager operations.
- **Always use Vite commands to run tools:** Don't attempt to run `vite vitest` or `vite oxlint`. They do not exist. Use `vite test` and `vite lint` instead.
- **Running scripts:** Vite+ commands take precedence over `package.json` scripts. If there is a `test` script defined in `scripts` that conflicts with the built-in `vite test` command, run it using `vite run test`.
- **Do not install Vitest, Oxlint, Oxfmt, or tsdown directly:** Vite+ wraps these tools. They must not be installed directly. You cannot upgrade these tools by installing their latest versions. Always use Vite+ commands.
- **Import JavaScript modules from `vite-plus`:** Instead of importing from `vite` or `vitest`, all modules should be imported from the project's `vite-plus` dependency. For example, `import { defineConfig } from 'vite-plus';` or `import { expect, test, vi } from 'vite-plus/test';`. You must not install `vitest` to import test utilities.
- **Type-Aware Linting:** There is no need to install `oxlint-tsgolint`, `vite lint --type-aware` works out of the box.

## Review Checklist for Agents

- [ ] Run `vite install` after pulling remote changes and before getting started.
- [ ] Run `vite lint`, `vite fmt`, and `vite test` to validate changes.
<!--VITE PLUS END-->
