import { describe, expect, it, vi } from "vitest";
import { IpfsShimTransport, type FetchLike } from "../src";
import { jsonResponse } from "./helpers/fetch";

describe("IpfsShimTransport", () => {
  it("preserves original ipfs transport URL", () => {
    const transport = new IpfsShimTransport("ipfs://QmHash/manifest.json", {
      fetch: vi.fn(async () => jsonResponse({ id: "org.test.ipfs" })) as FetchLike,
    });

    expect(transport.url).toBe("ipfs://QmHash/manifest.json");
  });

  it("maps manifest and resource requests through gateway", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "org.test.ipfs", resources: ["meta"], types: ["movie"] }))
      .mockResolvedValueOnce(jsonResponse({ meta: { id: "tt1" } }));

    const transport = new IpfsShimTransport("ipfs://QmHash/manifest.json", {
      fetch: fetchMock as FetchLike,
    });

    await transport.manifest();
    await transport.get(["meta", "movie", "tt1"]);

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://gateway.ipfs.io/ipfs/QmHash/manifest.json");
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://gateway.ipfs.io/ipfs/QmHash/meta/movie/tt1.json");
  });
});
