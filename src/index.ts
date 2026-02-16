export { AddonClient } from "./client/AddonClient";
export { fromDescriptor } from "./client/fromDescriptor";
export { detectFromURL } from "./client/detectFromURL";
export { AddonCollection } from "./collection/AddonCollection";

export {
  AddonClientError,
  ERR_BAD_HTTP,
  ERR_JSON_EXPECTED,
  ERR_MANIFEST_CALL_FIRST,
  ERR_MANIFEST_INVALID,
  ERR_NOT_FOUND,
  ERR_NO_TRANSPORT,
  ERR_PROTOCOL,
  ERR_RESP_UNRECOGNIZED,
  ERR_UNRECOGNIZED,
  ERR_UNSUPPORTED_ARGS,
  ERR_UNSUPPORTED_RESOURCE,
  ERR_URL,
  createError,
  isAddonClientError,
  toAddonClientError,
} from "./core/errors";

export { mapURL } from "./core/mapURL";
export { stringifyRequest } from "./core/stringifyRequest";
export { isSupported } from "./core/isSupported";

export {
  DEFAULT_IPFS_GATEWAY_ROOT,
  HttpTransport,
  IpfsShimTransport,
  LegacyTransport,
} from "./transports";

export type {
  AddonClientErrorCode,
  AddonClientErrorOptions,
} from "./core/errors";

export type {
  AddonClientFlags,
  AddonCollectionLike,
  AddonDescriptor,
  AddonGetCallback,
  AddonManifest,
  AddonRequestExtra,
  AddonRequestTuple,
  AddonRequestValue,
  AddonTransport,
  AddonTransportConstructor,
  DetectFromUrlLintHook,
  DetectFromUrlLintInput,
  DetectFromUrlOptions,
  DetectFromUrlResult,
  FetchLike,
  FromDescriptorOptions,
  LintResult,
  ManifestCatalog,
  ManifestResource,
  ManifestResourceObject,
  ParsedCacheControl,
  TransportCacheMetadata,
  TransportOptions,
  TransportResponse,
} from "./core/types";
