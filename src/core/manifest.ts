import { ERR_MANIFEST_INVALID, createError } from "./errors";
import { hasOwn, isRecord } from "./guards";
import type { AddonManifest } from "./types";

export function assertAddonManifest(value: unknown, url?: string): AddonManifest {
  if (!isRecord(value)) {
    throw createError(ERR_MANIFEST_INVALID, {
      details: { url, reason: "manifest is not an object" },
    });
  }

  if (!hasOwn(value, "id") || typeof value.id !== "string" || value.id.length === 0) {
    throw createError(ERR_MANIFEST_INVALID, {
      details: { url, reason: "manifest.id must be a non-empty string" },
    });
  }

  return value as AddonManifest;
}
