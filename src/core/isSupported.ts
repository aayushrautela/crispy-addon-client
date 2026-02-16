import type { AddonManifest, ManifestResource } from "./types";

function hasPrefix(id: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => id.startsWith(prefix));
}

function secondaryMatch(
  types: readonly string[] | undefined,
  idPrefixes: readonly string[] | undefined,
  type: string,
  id: string,
): boolean {
  if (!Array.isArray(types) || !types.includes(type)) {
    return false;
  }

  if (Array.isArray(idPrefixes)) {
    return hasPrefix(id, idPrefixes);
  }

  return true;
}

function matchesResourceName(resourceDef: ManifestResource, resource: string): boolean {
  if (typeof resourceDef === "string") {
    return resourceDef === resource;
  }

  return resourceDef.name === resource;
}

export function isSupported(
  manifest: AddonManifest,
  resource: string,
  type: string,
  id: string,
): boolean {
  if (resource === "catalog" && Array.isArray(manifest.catalogs)) {
    return manifest.catalogs.some((catalog) => catalog.type === type && catalog.id === id);
  }

  const resourceDef = Array.isArray(manifest.resources)
    ? manifest.resources.find((entry) => matchesResourceName(entry, resource))
    : undefined;

  if (!resourceDef) {
    return false;
  }

  if (typeof resourceDef === "string") {
    return secondaryMatch(manifest.types, manifest.idPrefixes, type, id);
  }

  return secondaryMatch(resourceDef.types, resourceDef.idPrefixes, type, id);
}
