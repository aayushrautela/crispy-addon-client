import {
  ERR_BAD_HTTP,
  ERR_PROTOCOL,
  ERR_RESP_UNRECOGNIZED,
  createError,
  toAddonClientError,
} from "../core/errors";
import { fetchWithCache, getFetch, parseJsonResponse } from "../core/fetch";
import { isRecord } from "../core/guards";
import { assertAddonManifest } from "../core/manifest";
import { mapURL } from "../core/mapURL";
import { getProtocol, toURL } from "../core/url";
import type {
  AddonCollectionLike,
  AddonDescriptor,
  AddonManifest,
  AddonTransport,
  DetectFromUrlOptions,
  DetectFromUrlResult,
  LintResult,
} from "../core/types";
import { HttpTransport } from "../transports/http";
import { IpfsShimTransport } from "../transports/ipfsShim";
import { LegacyTransport } from "../transports/legacy";
import { AddonClient } from "./AddonClient";

const SUPPORTED_PROTOCOLS = new Set<string | null>(["ipfs:", "ipns:", null, "http:", "https:"]);

function resolveManifestHeaderUrl(baseUrl: string, headerValue: string): string {
  try {
    return mapURL(new URL(headerValue, baseUrl).toString());
  } catch {
    return mapURL(headerValue);
  }
}

function shouldTreatAsJson(contentType: string | null, pathname: string): boolean {
  const isHeaderJson = typeof contentType === "string" && contentType.includes("application/json");
  return isHeaderJson || pathname.endsWith("manifest.json") || pathname.endsWith(".json");
}

async function runLint(
  options: DetectFromUrlOptions,
  kind: "manifest" | "collection",
  value: unknown,
  url: string,
): Promise<LintResult> {
  if (!options.lint) {
    return { valid: true };
  }

  return options.lint({
    kind,
    value,
    url,
  });
}

async function constructFromTransport(
  transport: AddonTransport,
  options: DetectFromUrlOptions,
): Promise<DetectFromUrlResult> {
  const manifestResponse = await transport.manifest();
  const manifest = assertAddonManifest(manifestResponse.data, transport.url);
  const lintResult = await runLint(options, "manifest", manifest, transport.url);

  if (!lintResult.valid) {
    throw createError(ERR_RESP_UNRECOGNIZED, {
      details: {
        url: transport.url,
        lintResult,
      },
    });
  }

  return {
    addon: new AddonClient(manifest, transport),
  };
}

function asCollection(value: unknown): AddonCollectionLike | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const isDescriptorArray = value.every(
    (entry) => isRecord(entry) && typeof entry.transportUrl === "string" && isRecord(entry.manifest),
  );

  return isDescriptorArray ? (value as AddonDescriptor[]) : null;
}

export async function detectFromURL(
  inputUrl: string,
  options: DetectFromUrlOptions = {},
): Promise<DetectFromUrlResult> {
  try {
    const mappedUrl = mapURL(inputUrl);
    const protocol = getProtocol(mappedUrl);

    if (!SUPPORTED_PROTOCOLS.has(protocol)) {
      throw createError(ERR_PROTOCOL, {
        details: { url: inputUrl, protocol },
      });
    }

    if (IpfsShimTransport.isValidURL(mappedUrl)) {
      return constructFromTransport(new IpfsShimTransport(mappedUrl, options), options);
    }

    if (LegacyTransport.isValidURL(mappedUrl)) {
      return constructFromTransport(new LegacyTransport(mappedUrl, options), options);
    }

    const fetchImpl = getFetch(options.fetch);
    const { response } = await fetchWithCache(fetchImpl, mappedUrl);
    if (response.status !== 200) {
      throw createError(ERR_BAD_HTTP, {
        details: { status: response.status, url: mappedUrl },
      });
    }

    const parsed = toURL(mappedUrl);
    const isJson = shouldTreatAsJson(response.headers.get("content-type"), parsed.pathname);
    const manifestHeader = response.headers.get("x-stremio-addon");

    if (manifestHeader) {
      const manifestUrl = resolveManifestHeaderUrl(mappedUrl, manifestHeader);
      return constructFromTransport(new HttpTransport(manifestUrl, options), options);
    }

    if (!isJson) {
      return constructFromTransport(new LegacyTransport(mappedUrl, options), options);
    }

    const payload = await parseJsonResponse<unknown>(response, mappedUrl);

    const collection = asCollection(payload);
    if (collection) {
      const lintResult = await runLint(options, "collection", collection, mappedUrl);
      if (!lintResult.valid) {
        throw createError(ERR_RESP_UNRECOGNIZED, {
          details: {
            url: mappedUrl,
            lintResult,
          },
        });
      }

      return { collection };
    }

    if (parsed.pathname.endsWith("manifest.json") && isRecord(payload) && typeof payload.id === "string") {
      const manifest = assertAddonManifest(payload as AddonManifest, mappedUrl);
      const lintResult = await runLint(options, "manifest", manifest, mappedUrl);

      if (!lintResult.valid) {
        throw createError(ERR_RESP_UNRECOGNIZED, {
          details: {
            url: mappedUrl,
            lintResult,
          },
        });
      }

      return {
        addon: new AddonClient(manifest, new HttpTransport(mappedUrl, options)),
      };
    }

    throw createError(ERR_RESP_UNRECOGNIZED, {
      details: {
        url: mappedUrl,
        payload,
      },
    });
  } catch (error) {
    throw toAddonClientError(error);
  }
}

export default detectFromURL;
