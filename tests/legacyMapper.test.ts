import { describe, expect, it } from "vitest";
import { mapLegacyManifest, mapLegacyRequest } from "../src/transports/legacyMapper";

describe("legacy mapper", () => {
  it("maps stream request (movie id)", () => {
    const request = mapLegacyRequest(["stream", "movie", "tt23141"]);
    expect(request?.method).toBe("stream.find");
    expect(request?.params).toEqual([null, { query: { imdb_id: "tt23141", type: "movie" } }]);
  });

  it("maps stream request (series season/episode)", () => {
    const request = mapLegacyRequest(["stream", "series", "tt23141:2:5"]);
    expect(request?.method).toBe("stream.find");
    expect(request?.params).toEqual([
      null,
      {
        query: {
          imdb_id: "tt23141",
          type: "series",
          season: 2,
          episode: 5,
        },
      },
    ]);
  });

  it("maps subtitles request with video metadata", () => {
    const request = mapLegacyRequest([
      "subtitles",
      "movie",
      "tt7026672:1:2",
      {
        videoHash: "f9abf20f944bc5fdad4f59491ea27f78",
        videoSize: 1073741824,
        videoName: "Blade Runner 1982 Open Matte BDRip 1080p DD 5.1 x264 - HighCode",
      },
    ]);

    expect(request?.method).toBe("subtitles.find");
    expect(request?.params).toEqual([
      null,
      {
        query: {
          itemHash: "tt7026672 1 2",
          videoHash: "f9abf20f944bc5fdad4f59491ea27f78",
          videoSize: 1073741824,
          videoName: "Blade Runner 1982 Open Matte BDRip 1080p DD 5.1 x264 - HighCode",
        },
      },
    ]);
  });

  it("maps legacy manifest metadata", () => {
    const manifest = mapLegacyManifest({
      methods: ["meta.get", "meta.find"],
      manifest: {
        id: "org.test.legacy",
        name: "Legacy Addon",
        description: "A non porn legacy addon",
        version: "1.2.3",
        types: ["movie", "series"],
        idProperty: ["imdb_id", "custom"],
        sorts: [null, { prop: "popularity", name: "Popular" }],
      },
    });

    expect(manifest.id).toBe("org.test.legacy");
    expect(manifest.idPrefixes).toEqual(["tt", "custom:"]);
    expect(manifest.catalogs).toEqual([
      { type: "movie", id: "top", name: null },
      { type: "series", id: "top", name: null },
      { type: "movie", id: "popularity", name: "Popular" },
      { type: "series", id: "popularity", name: "Popular" },
    ]);
  });
});
