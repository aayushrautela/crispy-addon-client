import { isRecord } from "./guards";

export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  const seen = new WeakSet<object>();

  const freezeRecursively = (input: unknown): void => {
    if (input === null || typeof input !== "object") {
      return;
    }

    const objectInput = input as object;
    if (seen.has(objectInput)) {
      return;
    }
    seen.add(objectInput);

    if (Array.isArray(input)) {
      for (const item of input) {
        freezeRecursively(item);
      }
      Object.freeze(input);
      return;
    }

    if (isRecord(input)) {
      for (const propertyValue of Object.values(input)) {
        freezeRecursively(propertyValue);
      }
      Object.freeze(input);
    }
  };

  freezeRecursively(value);
  return value;
}
