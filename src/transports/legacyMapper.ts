import { ERR_MANIFEST_INVALID, createError } from "../core/errors";
import { isRecord } from "../core/guards";
import type {
  AddonManifest,
  AddonRequestExtra,
  AddonRequestTuple,
  ManifestCatalog,
} from "../core/types";

export interface LegacyMappedRequest {
  readonly method: string;
  readonly params: readonly [null, Record<string, unknown>];
  readonly wrap: (value: unknown) => unknown;
}

function semverLike(version: string): boolean {
  const parts = version.split(".");
  return parts.length === 3 && parts.every((part) => Number.isFinite(Number(part)));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function mapIdPrefixes(idProperty: unknown): string[] {
  const source =
    typeof idProperty === "string"
      ? [idProperty]
      : Array.isArray(idProperty)
        ? idProperty.filter((entry): entry is string => typeof entry === "string")
        : [];

  return source.map((prefix) => {
    if (prefix === "imdb_id") {
      return "tt";
    }

    if (prefix === "yt_id") {
      return "UC";
    }

    return `${prefix}:`;
  });
}

interface LegacySort {
  readonly name?: string | null;
  readonly prop?: string;
}

function mapCatalogs(
  methods: readonly string[],
  types: readonly string[],
  sortsUnknown: unknown,
): readonly ManifestCatalog[] {
  if (!methods.includes("meta.find")) {
    return [];
  }

  const sorts = Array.isArray(sortsUnknown)
    ? sortsUnknown.filter((entry): entry is LegacySort => isRecord(entry) || entry === null)
    : [null];
  const normalizedSorts: readonly (LegacySort | null)[] = sorts.length > 0 ? sorts : [null];

  const catalogs: Array<{ type: string; id: string; name: string | null }> = [];

  for (const sort of normalizedSorts) {
    for (const type of types) {
      if (!sort) {
        catalogs.push({ type, id: "top", name: null });
      } else {
        catalogs.push({
          type,
          id: typeof sort.prop === "string" ? sort.prop : "top",
          name: sort.name ?? null,
        });
      }
    }
  }

  return catalogs;
}

function mapResources(methods: readonly string[]): string[] {
  const resources: string[] = [];

  if (methods.includes("meta.get")) {
    resources.push("meta");
  }

  if (methods.includes("stream.find")) {
    resources.push("stream");
  }

  if (methods.includes("subtitles.find")) {
    resources.push("subtitles");
  }

  return resources;
}

export function mapLegacyManifest(value: unknown): AddonManifest {
  if (!isRecord(value)) {
    throw createError(ERR_MANIFEST_INVALID, {
      details: { reason: "Legacy meta response is not an object" },
    });
  }

  const manifestRaw = isRecord(value.manifest) ? value.manifest : null;
  if (!manifestRaw) {
    throw createError(ERR_MANIFEST_INVALID, {
      details: { reason: "Legacy meta response has no manifest object" },
    });
  }

  if (typeof manifestRaw.id !== "string" || manifestRaw.id.length === 0) {
    throw createError(ERR_MANIFEST_INVALID, {
      details: { reason: "Legacy manifest.id must be a non-empty string" },
    });
  }

  const methods = asStringArray(value.methods);
  const types = asStringArray(manifestRaw.types);
  const description = typeof manifestRaw.description === "string" ? manifestRaw.description : null;
  const version =
    typeof manifestRaw.version === "string" && semverLike(manifestRaw.version)
      ? manifestRaw.version
      : "0.0.1";

  return {
    id: manifestRaw.id,
    ...(typeof manifestRaw.name === "string" ? { name: manifestRaw.name } : {}),
    ...(description !== null ? { description } : {}),
    ...(typeof manifestRaw.contactEmail === "string"
      ? { contactEmail: manifestRaw.contactEmail }
      : {}),
    ...(typeof manifestRaw.logo === "string" ? { logo: manifestRaw.logo } : {}),
    ...(typeof manifestRaw.background === "string" ? { background: manifestRaw.background } : {}),
    version,
    types,
    resources: mapResources(methods),
    catalogs: mapCatalogs(methods, types, manifestRaw.sorts),
    idPrefixes: mapIdPrefixes(manifestRaw.idProperty),
    behaviorHints: {
      adult: description?.toLowerCase().includes("porn") ?? false,
    },
  } satisfies AddonManifest;
}

function wrapKey(name: string): (value: unknown) => Record<string, unknown> {
  return (value: unknown): Record<string, unknown> => ({ [name]: value });
}

function getQueryFromId(id: string): Record<string, string | undefined> {
  const split = id.split(":");

  if (/^tt/.test(split[0] ?? "")) {
    return { imdb_id: split[0] };
  }

  if (/^UC/.test(split[0] ?? "")) {
    return { yt_id: split[0] };
  }

  return {
    [split[0] ?? "id"]: split[1],
  };
}

function toObjectExtra(args: AddonRequestTuple): AddonRequestExtra {
  if (args.length !== 4) {
    return {};
  }

  return args[3];
}

function remapCatalog(args: AddonRequestTuple): Record<string, unknown> {
  const id = args[2];
  const extra = toObjectExtra(args);

  const query: Record<string, unknown> = {
    type: args[1],
  };

  const remapped: Record<string, unknown> = {
    query,
    limit: 100,
  };

  if (id !== "top") {
    remapped.sort = {
      [id]: -1,
      popularity: -1,
    };
  }

  if (extra.skip !== undefined) {
    remapped.skip = extra.skip;
  }

  if (typeof extra.genre === "string") {
    query.genre = extra.genre;
  }

  return remapped;
}

function remapMeta(args: AddonRequestTuple): Record<string, unknown> {
  return {
    query: getQueryFromId(args[2]),
  };
}

function remapStream(args: AddonRequestTuple): Record<string, unknown> {
  const id = args[2];
  const query: Record<string, unknown> = {
    ...getQueryFromId(id),
    type: args[1],
  };

  const split = id.split(":");
  const parts = /^(tt|UC)/.test(id) ? split.slice(1) : split.slice(2);

  if (parts.length === 2) {
    query.season = Number.parseInt(parts[0] ?? "", 10);
    query.episode = Number.parseInt(parts[1] ?? "", 10);
  } else if (parts.length === 1 && parts[0]) {
    query.video_id = parts[0];
  }

  return {
    query,
  };
}

function remapSubtitles(args: AddonRequestTuple): Record<string, unknown> {
  const extra = toObjectExtra(args);
  const query: Record<string, unknown> = {
    itemHash: args[2].split(":").join(" "),
  };

  if (typeof extra.videoHash === "string") {
    query.videoHash = extra.videoHash;
  }

  if (typeof extra.videoName === "string") {
    query.videoName = extra.videoName;
  }

  if (typeof extra.videoSize === "number") {
    query.videoSize = extra.videoSize;
  }

  return {
    query,
  };
}

export function mapLegacyRequest(args: AddonRequestTuple): LegacyMappedRequest | null {
  const resource = args[0];

  if (resource === "catalog") {
    return {
      method: "meta.find",
      params: [null, remapCatalog(args)],
      wrap: wrapKey("metas"),
    };
  }

  if (resource === "meta") {
    return {
      method: "meta.get",
      params: [null, remapMeta(args)],
      wrap: wrapKey("meta"),
    };
  }

  if (resource === "stream") {
    return {
      method: "stream.find",
      params: [null, remapStream(args)],
      wrap: wrapKey("streams"),
    };
  }

  if (resource === "subtitles") {
    return {
      method: "subtitles.find",
      params: [null, remapSubtitles(args)],
      wrap: wrapKey("subtitles"),
    };
  }

  return null;
}
