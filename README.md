# crispy-addon-client

Modern, TypeScript-first client for the Stremio add-on protocol (v3).

Based on (and API-inspired by) the upstream `stremio-addon-client`.

- Works in Web apps, React Native, and Node 18+.
- Promise-first API with optional callback adapter.
- Strong typed errors and transport-level cache metadata.
- ESM-first package with CJS compatibility and tree-shakable transport entrypoints.

## Compatibility notes

- Errors are real `Error` instances (`AddonClientError`) with string codes (for example, `ERR_NOT_FOUND`).
- `detectFromURL()` does not run `stremio-addon-linter` by default. Linting is an optional hook.
- IPFS support is provided through an HTTP gateway shim (`ipfs://` / `ipns://` URLs are preserved as `transportUrl`).
- Legacy transport behavior is preserved for `/stremio/v1` and `/stremio/v1/stremioget` endpoints.

## Install

```bash
npm install crispy-addon-client
```

## Quick start (Web / Node)

```ts
import { detectFromURL } from "crispy-addon-client";

const detected = await detectFromURL("https://v3-cinemeta.strem.io/manifest.json");

if (detected.addon) {
  const addon = detected.addon;
  const catalog = await addon.get("catalog", "movie", "top", { skip: 0 });
  console.log(catalog);
}
```

## React Native usage

```ts
import { fromDescriptor } from "crispy-addon-client";

const addon = await fromDescriptor({
  manifest: {
    id: "org.example.addon",
    resources: ["meta"],
    types: ["movie"],
  },
  transportUrl: "https://example.com/manifest.json",
});

const meta = await addon.get("meta", "movie", "tt0111161");
```

## Core API

### `AddonClient`

- `manifest` (readonly/frozen)
- `transportUrl`
- `flags` (readonly/frozen)
- `isSupported(resource, type, id): boolean`
- `get(resource, type, id, extra?): Promise<unknown>`
- `get(resource, type, id, extra?, callback)` optional callback adapter
- `getWithMeta(resource, type, id, extra?)` to access cache metadata
- `destroy(): Promise<void>`
- `toDescriptor(): AddonDescriptor`

### Top-level functions

- `fromDescriptor(descriptor): Promise<AddonClient>`
- `detectFromURL(url, options?): Promise<{ addon?: AddonClient; collection?: AddonCollectionLike }>`
- `mapURL(url): string`
- `stringifyRequest(args): string`

### `AddonCollection`

- `load(descriptors): Promise<void>`
- `save(): AddonDescriptor[]`
- `getAddons(): AddonClient[]`
- `add(addon): void`
- `remove(addon): void`
- `includes(addon): boolean`
- `clone(): AddonCollection`

## Error handling

```ts
import { ERR_NOT_FOUND, isAddonClientError } from "crispy-addon-client";

try {
  await addon.get("meta", "movie", "tt123");
} catch (error) {
  if (isAddonClientError(error) && error.code === ERR_NOT_FOUND) {
    console.log("Resource not found");
  }
}
```

## Optional lint hook for `detectFromURL`

```ts
import { detectFromURL } from "crispy-addon-client";

const result = await detectFromURL("https://example.com/manifest.json", {
  lint: async ({ kind, value }) => {
    // Plug in stremio-addon-linter (or your own validator) here.
    // Return shape: { valid: boolean, ...extraMetadata }
    return { valid: true, kind, valueType: typeof value };
  },
});
```

## Tree-shakable transport entrypoints

```ts
import { HttpTransport } from "crispy-addon-client/transports/http";
import { IpfsShimTransport } from "crispy-addon-client/transports/ipfsShim";
import { LegacyTransport } from "crispy-addon-client/transports/legacy";
```

## Development

```bash
npm run typecheck
npm test
npm run build
```

## Legacy code

The previous JavaScript/CommonJS implementation is kept in `legacy/` for reference and parity checks.
