import type { ParsedCacheControl, TransportCacheMetadata } from "./types";

function parseInteger(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseCacheControl(headerValue: string | null): ParsedCacheControl | null {
  if (!headerValue) {
    return null;
  }

  const directives = headerValue
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  let maxAge: number | undefined;
  let sMaxAge: number | undefined;
  let staleWhileRevalidate: number | undefined;
  let staleIfError: number | undefined;

  let noCache = false;
  let noStore = false;
  let isPublic = false;
  let isPrivate = false;
  let immutable = false;
  let mustRevalidate = false;

  for (const directive of directives) {
    const [rawKey, rawValue] = directive.split("=", 2);
    if (!rawKey) {
      continue;
    }
    const key = rawKey.trim().toLowerCase();
    const value = rawValue?.trim().replace(/^"|"$/g, "");

    switch (key) {
      case "max-age":
        maxAge = parseInteger(value);
        break;
      case "s-maxage":
        sMaxAge = parseInteger(value);
        break;
      case "stale-while-revalidate":
        staleWhileRevalidate = parseInteger(value);
        break;
      case "stale-if-error":
        staleIfError = parseInteger(value);
        break;
      case "no-cache":
        noCache = true;
        break;
      case "no-store":
        noStore = true;
        break;
      case "public":
        isPublic = true;
        break;
      case "private":
        isPrivate = true;
        break;
      case "immutable":
        immutable = true;
        break;
      case "must-revalidate":
        mustRevalidate = true;
        break;
      default:
        break;
    }
  }

  return {
    raw: headerValue,
    ...(maxAge !== undefined ? { maxAge } : {}),
    ...(sMaxAge !== undefined ? { sMaxAge } : {}),
    ...(staleWhileRevalidate !== undefined ? { staleWhileRevalidate } : {}),
    ...(staleIfError !== undefined ? { staleIfError } : {}),
    noCache,
    noStore,
    isPublic,
    isPrivate,
    immutable,
    mustRevalidate,
  };
}

export function cacheMetadataFromHeaders(headers: Headers): TransportCacheMetadata {
  const cacheControl = headers.get("cache-control");

  return {
    cacheControl,
    cacheControlParsed: parseCacheControl(cacheControl),
  };
}
