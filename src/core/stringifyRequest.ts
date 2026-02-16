import type { AddonRequestTuple } from "./types";
import { isNonEmptyRecord, isRecord } from "./guards";

function normalizeQueryValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return "";
  }

  return String(value);
}

function encodeQueryObject(input: Readonly<Record<string, unknown>>): string {
  const segments: string[] = [];

  for (const [key, value] of Object.entries(input)) {
    const encodedKey = encodeURIComponent(key);

    if (Array.isArray(value)) {
      for (const nestedValue of value) {
        const encodedValue = encodeURIComponent(normalizeQueryValue(nestedValue));
        segments.push(`${encodedKey}=${encodedValue}`);
      }
      continue;
    }

    const encodedValue = encodeURIComponent(normalizeQueryValue(value));
    segments.push(`${encodedKey}=${encodedValue}`);
  }

  return segments.join("&");
}

function mapArg(argument: unknown): string {
  if (isNonEmptyRecord(argument)) {
    return encodeQueryObject(argument);
  }

  return encodeURIComponent(String(argument));
}

export function stringifyRequest(args: readonly unknown[] | AddonRequestTuple): string {
  if (args.length < 3 || args.length > 4) {
    throw new Error("args needs to be [resource, type, id, extra?]");
  }

  const normalizedArgs =
    args.length === 4 && (!isRecord(args[3]) || Object.keys(args[3]).length === 0)
      ? args.slice(0, 3)
      : args;

  return `/${normalizedArgs.map(mapArg).join("/")}.json`;
}
