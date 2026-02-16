import { describe, expect, it, vi } from "vitest";
import {
  ERR_BAD_HTTP,
  ERR_PROTOCOL,
  ERR_RESP_UNRECOGNIZED,
  detectFromURL,
  type FetchLike,
} from "../src";
import { jsonResponse, textResponse } from "./helpers/fetch";

describe("detectFromURL", () => {
  it("rejects unsupported protocols", async () => {
    await expect(detectFromURL("ftp://example.com")).rejects.toMatchObject({
      code: ERR_PROTOCOL,
    });
  });

  it("detects add-on from direct manifest URL", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ id: "org.test.direct", resources: ["meta"], types: ["movie"] }),
    );

    const result = await detectFromURL("https://example.com/manifest.json", {
      fetch: fetchMock as FetchLike,
    });

    expect(result.addon?.manifest.id).toBe("org.test.direct");
    expect(result.addon?.transportUrl).toBe("https://example.com/manifest.json");
  });

  it("detects add-on from x-stremio-addon header", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        textResponse("<html></html>", {
          status: 200,
          headers: {
            "content-type": "text/html",
            "x-stremio-addon": "/manifest.json",
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: "org.test.header", resources: ["meta"], types: ["movie"] }));

    const result = await detectFromURL("https://example.com/addon", {
      fetch: fetchMock as FetchLike,
    });

    expect(result.addon?.manifest.id).toBe("org.test.header");
    expect(result.addon?.transportUrl).toBe("https://example.com/manifest.json");
  });

  it("detects collection JSON payload", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse([
        {
          transportUrl: "https://example.com/a/manifest.json",
          manifest: { id: "org.test.a" },
        },
      ]),
    );

    const result = await detectFromURL("https://example.com/collection.json", {
      fetch: fetchMock as FetchLike,
    });

    expect(result.collection).toHaveLength(1);
    expect(result.collection?.[0]?.manifest.id).toBe("org.test.a");
  });

  it("maps non-200 response to ERR_BAD_HTTP", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: true }, { status: 500 }));

    await expect(
      detectFromURL("https://example.com/manifest.json", {
        fetch: fetchMock as FetchLike,
      }),
    ).rejects.toMatchObject({ code: ERR_BAD_HTTP });
  });

  it("returns ERR_RESP_UNRECOGNIZED for unknown JSON payload", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ hello: "world" }));

    await expect(
      detectFromURL("https://example.com/manifest.json", {
        fetch: fetchMock as FetchLike,
      }),
    ).rejects.toMatchObject({ code: ERR_RESP_UNRECOGNIZED });
  });

  it("supports optional lint hook", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: "org.test.lint", resources: ["meta"] }));

    await expect(
      detectFromURL("https://example.com/manifest.json", {
        fetch: fetchMock as FetchLike,
        lint: () => ({ valid: false, reason: "forced" }),
      }),
    ).rejects.toMatchObject({ code: ERR_RESP_UNRECOGNIZED });
  });
});
