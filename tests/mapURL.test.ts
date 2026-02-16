import { describe, expect, it } from "vitest";
import { mapURL } from "../src/core/mapURL";

describe("mapURL", () => {
  it("does not touch ipfs protocol", () => {
    expect(mapURL("ipfs://test/")).toBe("ipfs://test/");
  });

  it("maps protocol-relative URLs to https", () => {
    expect(mapURL("//test/")).toBe("https://test/");
  });

  it("maps http to https for non-local hosts", () => {
    expect(mapURL("http://test/")).toBe("https://test/");
  });

  it("keeps localhost protocol and normalizes hostname", () => {
    expect(mapURL("http://localhost/")).toBe("http://127.0.0.1/");
    expect(mapURL("http://127.0.0.1/")).toBe("http://127.0.0.1/");
  });
});
