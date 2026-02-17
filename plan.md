# Plan: Modern TypeScript Rewrite (crispy-addon-client)

This repo will be rewritten into a modern, production-ready add-on client library for Web + React Native + Node 18+, while preserving Stremio add-on protocol v3 behavior and the upstream public API surface (manifest loading + resource calls).

We will keep the upstream public concepts (`AddonClient`, `AddonCollection`, transports, `detectFromURL`, `fromDescriptor`, `mapURL`, `stringifyRequest`) but implement them as a TypeScript-first, strict, ESM-first package with a strong error model and modern fetch-based transports.

## Compatibility Notes (intentional deviations)

- Errors become real `Error` instances (`AddonClientError`) with string `code` values (e.g. `ERR_NOT_FOUND`) instead of upstream plain objects with numeric `code`.
- `detectFromURL()` will not run `stremio-addon-linter` by default; linting becomes an optional hook/plugin to avoid bundle cost.
- The heavy js-ipfs transport will not ship in the modern runtime bundle; only the IPFS/IPNS HTTP-gateway shim will be supported. The old implementation is preserved in `legacy/`.
- Cache metadata is preserved and typed at the transport layer (and in callback adapters). Promise-style `addon.get()` remains Promise-first and resolves to the payload (upstream-like).

## Decisions

- IPFS shim gateway default: keep upstream `https://gateway.ipfs.io/`.
- We will move the current implementation into `legacy/` (source + tests) and build the new library in `src/`.

## Current Upstream Behavior Inventory (to preserve)

Core objects and helpers:

- `AddonClient` is immutable (instance frozen), exposes:
  - `manifest` (frozen/readonly)
  - `transportUrl`
  - `flags` (frozen/readonly)
  - `isSupported(resource, type, id): boolean`
  - `get(resource, type, id, extra?): Promise<...>`
  - `destroy(): Promise<void>`
  - `toDescriptor(): AddonDescriptor`
- `fromDescriptor(descriptor)` picks transport via `isValidURL()` and creates `AddonClient`.
- `detectFromURL(url)` detects: addon vs collection vs unrecognized, and recognizes legacy endpoints.
- `mapURL(url)` forces https (except local) and changes `localhost` -> `127.0.0.1`.
- `stringifyRequest([resource, type, id, extra?])` builds `/resource/type/id/extra.json` path, with exact encoding semantics.
- `isSupported(manifest, resource, type, id)` supports:
  - special-case `catalog` via `manifest.catalogs`
  - resource entries that are strings or objects (`{ name, types, idPrefixes }`)

Transports (preserve behavior, modernize internals):

- HTTP(S): assumes `.../manifest.json`, supports `manifest()` and `get(args)`; maps HTTP status 404 -> `ERR_NOT_FOUND` and other non-200 -> `ERR_BAD_HTTP`.
- IPFS/IPNS shim: maps to HTTP gateway URL for network requests but preserves original `ipfs://` / `ipns://` as `transportUrl`.
- Legacy transport: maps legacy JSON-RPC endpoints (`/stremio/v1` and `/stremio/v1/stremioget`) to v3 responses via the legacy mapper.

## New Project Layout

We will implement a clean, tree-shakable TypeScript codebase:

- `src/core/`
  - `types.ts` (strict types for manifest/descriptor/request/transport)
  - `errors.ts` (exported error codes + `AddonClientError`)
  - `mapURL.ts`
  - `stringifyRequest.ts`
  - `isSupported.ts`
  - `cacheControl.ts` (parse cache-control into typed metadata)
  - `fetchJson.ts` (shared fetch helper + JSON handling)
  - `base64.ts` (portable base64 for legacy transport; no Node-only APIs)
- `src/transports/`
  - `http.ts`
  - `ipfsShim.ts`
  - `legacy.ts`
  - `legacyMapper.ts`
- `src/client/`
  - `AddonClient.ts`
  - `fromDescriptor.ts`
  - `detectFromURL.ts` (optional lint hook)
- `src/collection/`
  - `AddonCollection.ts`
- `src/index.ts` (public exports)

Legacy preservation:

- `legacy/` will contain the current upstream code and tests (kept intact as reference/parity).

## Public API (new)

Exported API will match the upstream surface, with modern typing:

- `class AddonClient`
- `class AddonCollection`
- `function fromDescriptor(descriptor): Promise<AddonClient> | AddonClient` (final signature decided during implementation; goal is ergonomic and protocol-faithful)
- `function detectFromURL(url, options?): Promise<{ addon?: AddonClient; collection?: AddonCollectionLike }>`
- `function mapURL(url): string`
- `function stringifyRequest(args): string`
- Tree-shakable transports:
  - `transports/http`
  - `transports/ipfsShim`
  - `transports/legacy`

## Error Model

- Export string error codes mirroring upstream names:
  - `ERR_URL`, `ERR_PROTOCOL`, `ERR_UNRECOGNIZED`, `ERR_NO_TRANSPORT`, `ERR_BAD_HTTP`, `ERR_RESP_UNRECOGNIZED`, `ERR_JSON_EXPECTED`, `ERR_NOT_FOUND`, `ERR_UNSUPPORTED_RESOURCE`, `ERR_UNSUPPORTED_ARGS`, `ERR_MANIFEST_INVALID`, `ERR_MANIFEST_CALL_FIRST`
- Throw `AddonClientError` with:
  - `code: AddonClientErrorCode`
  - `message`
  - optional `cause`
  - optional metadata (e.g. `lintResult`, http status, url)

## Build & Packaging

- ESM-first build with CJS compatibility if feasible.
- `exports` map with subpath exports for transports.
- No dependency on `node-fetch`.
- Node 18+ required (global `fetch`).
- Types emitted in `dist/`.

Likely tooling:

- Build: `tsup` (or equivalent) to emit `dist/index.js` (ESM), `dist/index.cjs` (CJS), and `.d.ts`.
- Tests: Vitest.

## Testing Plan (Vitest)

Unit tests will cover:

- URL mapping rules (`mapURL`).
- Transport URL validation (`isValidURL`).
- Manifest loading success/failure.
- HTTP status mapping: 404 -> `ERR_NOT_FOUND`; non-200 -> `ERR_BAD_HTTP`.
- Request URL construction (`stringifyRequest` parity).
- IPFS/IPNS shim mapping + `transportUrl` preservation.
- `isSupported` correctness vs manifest resources/types/idPrefixes/catalogs.
- Legacy mapper correctness (ported from existing tape tests).

Implementation detail: tests will stub `globalThis.fetch` (no real network).

## Documentation

- Minimal README with examples for:
  - Web (Vite/webpack)
  - React Native (Metro)
  - Node 18+
- Optional lint hook example (how to plug in `stremio-addon-linter` without bundling it by default).

## Execution Steps

1) Move current codebase into `legacy/` (keep history in git; do not rewrite its behavior).
2) Add `src/` implementation (TypeScript) following the layout above.
3) Add build config (`package.json` exports, `tsconfig.json`, build tool config).
4) Add Vitest tests implementing the test plan.
5) Update docs and add minimal examples.
6) Run tests and build in Node 18+.

## Approval Gate

After you approve this plan, implementation will begin (file moves + new TypeScript code + tests + build config).
