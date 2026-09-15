# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

urllib is a Node.js HTTP client library built on top of [undici](https://undici.nodejs.org/). It provides features like basic/digest authentication, redirections, timeout handling, gzip/brotli compression, file uploads, and HTTP/2 support.

## Common Commands

```bash
# Install dependencies (uses pnpm)
vp install

# Run all tests
vp test run

# Run a single test file
vp test run test/options.timeout.test.ts

# Run tests matching a pattern
vp test run -t "should timeout"

# Run tests with debug output
NODE_DEBUG=urllib:* vp test run

# Lint code
vp lint

# Format code
vp fmt

# Type check
vp check

# Build the project (outputs to dist/)
vp build

# Run benchmarks
vp run bench

# Run coverage
vp run cov
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

Uses `vp pack` with the `pack` configuration in `vite.config.ts` to build ESM/CommonJS output and TypeScript declarations:

- ESM output: `dist/esm/`
- CommonJS output: `dist/commonjs/`

The package exports both formats via conditional exports in `package.json`. `vp build` uses the same packaging configuration. The build inserts the package version into the User-Agent header.

### Testing

Tests use Vitest 5 through `vite-plus/test` with:

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

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
