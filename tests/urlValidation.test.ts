import { describe, expect, it } from "vitest";
import { HttpTransport } from "../src/transports/http";
import { IpfsShimTransport } from "../src/transports/ipfsShim";
import { LegacyTransport } from "../src/transports/legacy";

describe("transport URL validation", () => {
  it("validates HTTP transport URLs", () => {
    expect(HttpTransport.isValidURL("https://example.com/manifest.json")).toBe(true);
    expect(HttpTransport.isValidURL("//example.com/manifest.json")).toBe(true);
    expect(HttpTransport.isValidURL("https://example.com/addon.json")).toBe(false);
    expect(HttpTransport.isValidURL("ftp://example.com/manifest.json")).toBe(false);
  });

  it("validates IPFS shim URLs", () => {
    expect(IpfsShimTransport.isValidURL("ipfs://QmHash/manifest.json")).toBe(true);
    expect(IpfsShimTransport.isValidURL("ipns://k51Hash/manifest.json")).toBe(true);
    expect(IpfsShimTransport.isValidURL("https://example.com/manifest.json")).toBe(false);
  });

  it("validates legacy transport URLs", () => {
    expect(LegacyTransport.isValidURL("https://example.com/stremio/v1")).toBe(true);
    expect(LegacyTransport.isValidURL("https://example.com/stremio/v1/stremioget")).toBe(true);
    expect(LegacyTransport.isValidURL("https://example.com/manifest.json")).toBe(false);
  });
});
