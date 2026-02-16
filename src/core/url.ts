import { ERR_URL, createError } from "./errors";

const PROTOCOL_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

export function hasExplicitProtocol(input: string): boolean {
  return PROTOCOL_PATTERN.test(input);
}

export function getProtocol(input: string): string | null {
  if (input.startsWith("//")) {
    return null;
  }

  const protocolMatch = input.match(PROTOCOL_PATTERN);
  return protocolMatch ? protocolMatch[0].toLowerCase() : null;
}

export function toURL(input: string): URL {
  try {
    if (input.startsWith("//")) {
      return new URL(`https:${input}`);
    }

    if (hasExplicitProtocol(input)) {
      return new URL(input);
    }

    return new URL(`https://${input}`);
  } catch (cause) {
    throw createError(ERR_URL, {
      cause,
      details: { url: input },
    });
  }
}

export function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function ensureTrailingSlash(input: string): string {
  return input.endsWith("/") ? input : `${input}/`;
}
