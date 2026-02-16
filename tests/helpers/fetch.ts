import { vi } from "vitest";

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export function textResponse(body: string, init: ResponseInit = {}): Response {
  return new Response(body, init);
}

export function createFetchMock(...responses: Response[]) {
  const queue = [...responses];
  return vi.fn(async () => {
    const next = queue.shift();
    if (!next) {
      throw new Error("No more mocked responses");
    }
    return next;
  });
}
