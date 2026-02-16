import { describe, expect, it } from "vitest";
import { isSupported } from "../src/core/isSupported";

describe("isSupported", () => {
  it("checks simple resources and types", () => {
    const manifest = { id: "org.test.simple", resources: ["meta", "stream"], types: ["movie", "channel"] };
    expect(isSupported(manifest, "meta", "movie", "1")).toBe(true);
    expect(isSupported(manifest, "stream", "movie", "1")).toBe(true);
    expect(isSupported(manifest, "meta", "series", "1")).toBe(false);
    expect(isSupported(manifest, "madeup", "movie", "1")).toBe(false);
  });

  it("checks idPrefixes", () => {
    const manifest = {
      id: "org.test.prefixes",
      resources: ["meta"],
      types: ["movie"],
      idPrefixes: ["tt", "yt_id:"],
    };
    expect(isSupported(manifest, "meta", "movie", "1")).toBe(false);
    expect(isSupported(manifest, "meta", "movie", "tt1")).toBe(true);
    expect(isSupported(manifest, "meta", "movie", "yt_id:1")).toBe(true);
  });

  it("supports resource-specific types and prefixes", () => {
    const manifest = {
      id: "org.test.resource-specific",
      resources: [
        { name: "stream", types: ["movie", "series"], idPrefixes: ["tt"] },
        { name: "meta", types: ["other"], idPrefixes: ["local:"] },
      ],
    };

    expect(isSupported(manifest, "stream", "movie", "tt2")).toBe(true);
    expect(isSupported(manifest, "stream", "other", "local:2")).toBe(false);
    expect(isSupported(manifest, "meta", "other", "local:2")).toBe(true);
    expect(isSupported(manifest, "meta", "movie", "tt2")).toBe(false);
  });

  it("supports catalog special case", () => {
    const manifest = {
      id: "org.test.catalog",
      catalogs: [
        { id: "top", type: "movie" },
        { id: "top2", type: "channel" },
      ],
    };

    expect(isSupported(manifest, "catalog", "movie", "top")).toBe(true);
    expect(isSupported(manifest, "catalog", "channel", "top2")).toBe(true);
    expect(isSupported(manifest, "catalog", "channel", "top")).toBe(false);
  });
});
