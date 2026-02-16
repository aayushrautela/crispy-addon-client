export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

export type AddonRequestValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ReadonlyArray<string | number | boolean | null | undefined>;

export type AddonRequestExtra = Readonly<Record<string, AddonRequestValue>>;

export type AddonRequestTuple =
  | readonly [resource: string, type: string, id: string]
  | readonly [resource: string, type: string, id: string, extra: AddonRequestExtra];

export interface ManifestResourceObject {
  readonly name: string;
  readonly types?: readonly string[];
  readonly idPrefixes?: readonly string[];
  readonly [key: string]: unknown;
}

export type ManifestResource = string | ManifestResourceObject;

export interface ManifestCatalog {
  readonly type: string;
  readonly id: string;
  readonly name?: string | null;
  readonly [key: string]: unknown;
}

export interface AddonManifest {
  readonly id: string;
  readonly name?: string;
  readonly version?: string;
  readonly description?: string;
  readonly resources?: readonly ManifestResource[];
  readonly types?: readonly string[];
  readonly idPrefixes?: readonly string[];
  readonly catalogs?: readonly ManifestCatalog[];
  readonly behaviorHints?: Readonly<Record<string, unknown>>;
  readonly [key: string]: unknown;
}

export type AddonClientFlags = Readonly<Record<string, unknown>>;

export interface AddonDescriptor {
  readonly manifest: AddonManifest;
  readonly transportUrl: string;
  readonly flags?: AddonClientFlags;
}

export interface ParsedCacheControl {
  readonly raw: string;
  readonly maxAge?: number;
  readonly sMaxAge?: number;
  readonly staleWhileRevalidate?: number;
  readonly staleIfError?: number;
  readonly noCache: boolean;
  readonly noStore: boolean;
  readonly isPublic: boolean;
  readonly isPrivate: boolean;
  readonly immutable: boolean;
  readonly mustRevalidate: boolean;
}

export interface TransportCacheMetadata {
  readonly cacheControl: string | null;
  readonly cacheControlParsed: ParsedCacheControl | null;
}

export interface TransportResponse<T> {
  readonly data: T;
  readonly cache: TransportCacheMetadata;
}

export interface AddonTransport {
  readonly url: string;
  manifest(): Promise<TransportResponse<AddonManifest>>;
  get(args: AddonRequestTuple): Promise<TransportResponse<unknown>>;
  destroy?(): Promise<void>;
}

export interface TransportOptions {
  readonly fetch?: FetchLike;
  readonly ipfsGateway?: string;
}

export interface AddonTransportConstructor<TTransport extends AddonTransport = AddonTransport> {
  new (url: string, options?: TransportOptions): TTransport;
  isValidURL(url: string): boolean;
}

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type AddonGetCallback<T = unknown> = (
  error: unknown | null,
  data?: T,
  cache?: TransportCacheMetadata,
) => void;

export interface LintResult {
  readonly valid: boolean;
  readonly [key: string]: unknown;
}

export interface DetectFromUrlLintInput {
  readonly kind: "manifest" | "collection";
  readonly value: unknown;
  readonly url: string;
}

export type DetectFromUrlLintHook = (
  input: DetectFromUrlLintInput,
) => Promise<LintResult> | LintResult;

export interface DetectFromUrlOptions {
  readonly fetch?: FetchLike;
  readonly lint?: DetectFromUrlLintHook;
  readonly ipfsGateway?: string;
}

export interface DetectFromUrlResult {
  readonly addon?: import("../client/AddonClient").AddonClient;
  readonly collection?: AddonCollectionLike;
}

export type AddonCollectionLike = readonly AddonDescriptor[];

export interface FromDescriptorOptions {
  readonly fetch?: FetchLike;
  readonly ipfsGateway?: string;
}
