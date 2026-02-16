export const ERR_URL = "ERR_URL" as const;
export const ERR_PROTOCOL = "ERR_PROTOCOL" as const;
export const ERR_UNRECOGNIZED = "ERR_UNRECOGNIZED" as const;
export const ERR_NO_TRANSPORT = "ERR_NO_TRANSPORT" as const;
export const ERR_BAD_HTTP = "ERR_BAD_HTTP" as const;
export const ERR_RESP_UNRECOGNIZED = "ERR_RESP_UNRECOGNIZED" as const;
export const ERR_JSON_EXPECTED = "ERR_JSON_EXPECTED" as const;
export const ERR_NOT_FOUND = "ERR_NOT_FOUND" as const;
export const ERR_UNSUPPORTED_RESOURCE = "ERR_UNSUPPORTED_RESOURCE" as const;
export const ERR_MANIFEST_INVALID = "ERR_MANIFEST_INVALID" as const;
export const ERR_MANIFEST_CALL_FIRST = "ERR_MANIFEST_CALL_FIRST" as const;
export const ERR_UNSUPPORTED_ARGS = "ERR_UNSUPPORTED_ARGS" as const;

export type AddonClientErrorCode =
  | typeof ERR_URL
  | typeof ERR_PROTOCOL
  | typeof ERR_UNRECOGNIZED
  | typeof ERR_NO_TRANSPORT
  | typeof ERR_BAD_HTTP
  | typeof ERR_RESP_UNRECOGNIZED
  | typeof ERR_JSON_EXPECTED
  | typeof ERR_NOT_FOUND
  | typeof ERR_UNSUPPORTED_RESOURCE
  | typeof ERR_MANIFEST_INVALID
  | typeof ERR_MANIFEST_CALL_FIRST
  | typeof ERR_UNSUPPORTED_ARGS;

const DEFAULT_MESSAGES: Readonly<Record<AddonClientErrorCode, string>> = {
  ERR_URL: "Invalid URL",
  ERR_PROTOCOL: "Unsupported protocol",
  ERR_UNRECOGNIZED: "Unrecognized add-on response",
  ERR_NO_TRANSPORT: "No transport can handle this URL",
  ERR_BAD_HTTP: "Unexpected HTTP status code",
  ERR_RESP_UNRECOGNIZED: "Response shape is not recognized",
  ERR_JSON_EXPECTED: "Expected a valid JSON response",
  ERR_NOT_FOUND: "Requested resource was not found",
  ERR_UNSUPPORTED_RESOURCE: "Resource is not supported by this transport",
  ERR_MANIFEST_INVALID: "Manifest is invalid",
  ERR_MANIFEST_CALL_FIRST: "Manifest must be loaded before this operation",
  ERR_UNSUPPORTED_ARGS: "Unsupported request arguments",
};

export interface AddonClientErrorOptions {
  readonly message?: string;
  readonly cause?: unknown;
  readonly details?: Readonly<Record<string, unknown>>;
}

export class AddonClientError extends Error {
  readonly code: AddonClientErrorCode;
  readonly details?: Readonly<Record<string, unknown>>;

  constructor(code: AddonClientErrorCode, options: AddonClientErrorOptions = {}) {
    super(options.message ?? DEFAULT_MESSAGES[code]);
    this.name = "AddonClientError";
    this.code = code;

    if (options.details !== undefined) {
      this.details = options.details;
    }

    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export function createError(
  code: AddonClientErrorCode,
  options: AddonClientErrorOptions = {},
): AddonClientError {
  return new AddonClientError(code, options);
}

export function isAddonClientError(value: unknown): value is AddonClientError {
  return value instanceof AddonClientError;
}

export function toAddonClientError(
  value: unknown,
  fallbackCode: AddonClientErrorCode = ERR_UNRECOGNIZED,
  fallbackMessage?: string,
): AddonClientError {
  if (isAddonClientError(value)) {
    return value;
  }

  if (value instanceof Error) {
    return createError(fallbackCode, {
      message: fallbackMessage ?? value.message,
      cause: value,
    });
  }

  if (fallbackMessage !== undefined) {
    return createError(fallbackCode, {
      message: fallbackMessage,
      details: { value },
    });
  }

  return createError(fallbackCode, {
    details: { value },
  });
}
