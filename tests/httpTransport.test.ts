import { describe, expect, it, vi } from "vitest";
import {
  ERR_BAD_HTTP,
  ERR_NOT_FOUND,
  HttpTransport,
  type FetchLike,
} from "../src";
import { jsonResponse } from "./helpers/fetch";

const TRANSPORT_URL = "https://example.com/manifest.json";

describe("HttpTransport", () => {
  it("loads manifest successfully with cache metadata", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        { id: "org.test.addon", resources: ["meta"], types: ["movie"] },
        { headers: { "cache-control": "max-age=120, public" } },
      ),
    );

    const transport = new HttpTransport(TRANSPORT_URL, { fetch: fetchMock as FetchLike });
    const result = await transport.manifest();

    expect(result.data.id).toBe("org.test.addon");
    expect(result.cache.cacheControl).toContain("max-age=120");
    expect(result.cache.cacheControlParsed?.maxAge).toBe(120);
  });

  it("builds request URL correctly for resource calls", async () => {
    const calledUrls: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      calledUrls.push(String(input));
      return jsonResponse({ metas: [] });
    });
    const transport = new HttpTransport(TRANSPORT_URL, { fetch: fetchMock as FetchLike });

    await transport.get(["catalog", "series", "top", { search: "the office", skip: 2 }]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(calledUrls[0]).toBe("https://example.com/catalog/series/top/search=the%20office&skip=2.json");
  });

  it("maps 404 to ERR_NOT_FOUND", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: true }, { status: 404 }));
    const transport = new HttpTransport(TRANSPORT_URL, { fetch: fetchMock as FetchLike });

    await expect(transport.get(["meta", "movie", "tt1"])).rejects.toMatchObject({
      code: ERR_NOT_FOUND,
    });
  });

  it("maps non-200 status to ERR_BAD_HTTP", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: true }, { status: 500 }));
    const transport = new HttpTransport(TRANSPORT_URL, { fetch: fetchMock as FetchLike });

    await expect(transport.manifest()).rejects.toMatchObject({
      code: ERR_BAD_HTTP,
    });
  });
});
