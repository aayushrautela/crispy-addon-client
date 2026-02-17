import { ERR_BAD_HTTP, ERR_NOT_FOUND, createError } from "../core/errors";
import { fetchWithCache, getFetch, parseJsonResponse } from "../core/fetch";
import { assertAddonManifest } from "../core/manifest";
import { mapURL } from "../core/mapURL";
import { stringifyRequest } from "../core/stringifyRequest";
import { getProtocol, toURL } from "../core/url";
import type {
  AddonManifest,
  AddonRequestTuple,
  AddonTransport,
  FetchLike,
  TransportOptions,
  TransportResponse,
} from "../core/types";

function isHttpLikeProtocol(protocol: string | null): boolean {
  return protocol === null || protocol === "http:" || protocol === "https:";
}

function endsWithManifestJson(url: string): boolean {
  return toURL(url).pathname.endsWith("/manifest.json");
}

export class HttpTransport implements AddonTransport {
  readonly url: string;

  private readonly fetchImpl: FetchLike;

  constructor(url: string, options: TransportOptions = {}) {
    this.url = mapURL(url);
    this.fetchImpl = getFetch(options.fetch);
  }

  static isValidURL(url: string): boolean {
    try {
      const mappedUrl = mapURL(url);
      const protocol = getProtocol(mappedUrl);
      if (!isHttpLikeProtocol(protocol)) {
        return false;
      }

      return endsWithManifestJson(mappedUrl);
    } catch {
      return false;
    }
  }

  async manifest(): Promise<TransportResponse<AddonManifest>> {
    const result = await this.requestJson<unknown>(this.url);

    return {
      data: assertAddonManifest(result.data, this.url),
      cache: result.cache,
    };
  }

  async get(args: AddonRequestTuple): Promise<TransportResponse<unknown>> {
    if (!HttpTransport.isValidURL(this.url)) {
      throw createError(ERR_BAD_HTTP, {
        message: "Transport URL must end with /manifest.json",
        details: { transportUrl: this.url },
      });
    }

    const requestPath = stringifyRequest(args);
    const parsed = toURL(this.url);

    if (!parsed.pathname.endsWith("/manifest.json")) {
      throw createError(ERR_BAD_HTTP, {
        message: "Transport URL must end with /manifest.json",
        details: { transportUrl: this.url },
      });
    }

    parsed.pathname = parsed.pathname.slice(0, -"/manifest.json".length) + requestPath;
    parsed.hash = "";

    return this.requestJson<unknown>(parsed.toString());
  }

  private async requestJson<T>(url: string): Promise<TransportResponse<T>> {
    const { response, cache } = await fetchWithCache(this.fetchImpl, url);

    if (response.status === 404) {
      throw createError(ERR_NOT_FOUND, {
        details: { status: response.status, url },
      });
    }

    if (response.status !== 200) {
      throw createError(ERR_BAD_HTTP, {
        details: { status: response.status, url },
      });
    }

    return {
      data: await parseJsonResponse<T>(response, url),
      cache,
    };
  }
}
