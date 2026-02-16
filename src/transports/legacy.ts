import { encodeBase64Utf8 } from "../core/base64";
import {
  ERR_BAD_HTTP,
  ERR_RESP_UNRECOGNIZED,
  ERR_UNSUPPORTED_ARGS,
  ERR_UNSUPPORTED_RESOURCE,
  createError,
} from "../core/errors";
import { fetchWithCache, getFetch, parseJsonResponse } from "../core/fetch";
import { assertAddonManifest } from "../core/manifest";
import { getProtocol, toURL } from "../core/url";
import { mapLegacyManifest, mapLegacyRequest } from "./legacyMapper";
import type {
  AddonManifest,
  AddonRequestTuple,
  AddonTransport,
  FetchLike,
  TransportCacheMetadata,
  TransportOptions,
  TransportResponse,
} from "../core/types";

interface JsonRpcResponse {
  readonly error?: unknown;
  readonly result?: unknown;
}

function isHttpLikeProtocol(protocol: string | null): boolean {
  return protocol === null || protocol === "http:" || protocol === "https:";
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export class LegacyTransport implements AddonTransport {
  readonly url: string;

  private readonly fetchImpl: FetchLike;

  constructor(url: string, options: TransportOptions = {}) {
    this.url = url;
    this.fetchImpl = getFetch(options.fetch);
  }

  static isValidURL(url: string): boolean {
    try {
      const protocol = getProtocol(url);
      if (!isHttpLikeProtocol(protocol)) {
        return false;
      }

      const path = toURL(url).pathname;
      return path.endsWith("/stremio/v1") || path.endsWith("/stremio/v1/stremioget");
    } catch {
      return false;
    }
  }

  async manifest(): Promise<TransportResponse<AddonManifest>> {
    const rpcResponse = await this.jsonRpcRequest("meta", []);
    const manifest = mapLegacyManifest(rpcResponse.data);

    return {
      data: assertAddonManifest(manifest, this.url),
      cache: rpcResponse.cache,
    };
  }

  async get(args: AddonRequestTuple): Promise<TransportResponse<unknown>> {
    if (args.length < 3) {
      throw createError(ERR_UNSUPPORTED_ARGS, {
        details: { args },
      });
    }

    const request = mapLegacyRequest(args);
    if (!request) {
      throw createError(ERR_UNSUPPORTED_RESOURCE, {
        details: { resource: args[0] },
      });
    }

    const rpcResponse = await this.jsonRpcRequest(request.method, request.params);
    return {
      data: request.wrap(rpcResponse.data),
      cache: rpcResponse.cache,
    };
  }

  private async jsonRpcRequest(
    method: string,
    params: readonly unknown[],
  ): Promise<{ data: unknown; cache: TransportCacheMetadata }> {
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    });

    const baseUrl = normalizeBaseUrl(this.url);
    const requestUrl = `${baseUrl}/q.json?b=${encodeBase64Utf8(payload)}`;
    const { response, cache } = await fetchWithCache(this.fetchImpl, requestUrl);

    if (response.status !== 200) {
      throw createError(ERR_BAD_HTTP, {
        details: { status: response.status, url: requestUrl },
      });
    }

    const decoded = await parseJsonResponse<JsonRpcResponse>(response, requestUrl);

    if (decoded && typeof decoded === "object" && "error" in decoded && decoded.error) {
      throw createError(ERR_RESP_UNRECOGNIZED, {
        details: {
          url: requestUrl,
          rpcError: decoded.error,
        },
      });
    }

    if (!decoded || typeof decoded !== "object" || !("result" in decoded)) {
      throw createError(ERR_RESP_UNRECOGNIZED, {
        details: {
          url: requestUrl,
          rpcResponse: decoded,
        },
      });
    }

    return {
      data: decoded.result,
      cache,
    };
  }
}
