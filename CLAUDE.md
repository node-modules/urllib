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
