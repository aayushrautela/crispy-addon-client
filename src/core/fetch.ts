import { ERR_BAD_HTTP, ERR_JSON_EXPECTED, createError } from "./errors";
import { cacheMetadataFromHeaders } from "./cacheControl";
import type { FetchLike, TransportCacheMetadata } from "./types";

export function getFetch(fetchImpl?: FetchLike): FetchLike {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof globalThis.fetch === "function") {
    return globalThis.fetch.bind(globalThis) as FetchLike;
  }

  throw createError(ERR_BAD_HTTP, {
    message: "Global fetch is not available in this runtime",
  });
}

export interface FetchResult {
  readonly response: Response;
  readonly cache: TransportCacheMetadata;
}

export async function fetchWithCache(
  fetchImpl: FetchLike,
  url: string,
  init?: RequestInit,
): Promise<FetchResult> {
  let response: Response;

  try {
    response = await fetchImpl(url, init);
  } catch (cause) {
    throw createError(ERR_BAD_HTTP, {
      message: "Network request failed",
      cause,
      details: { url },
    });
  }

  return {
    response,
    cache: cacheMetadataFromHeaders(response.headers),
  };
}

export async function parseJsonResponse<T = unknown>(response: Response, url: string): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw createError(ERR_JSON_EXPECTED, {
      cause,
      details: { url },
    });
  }
}
