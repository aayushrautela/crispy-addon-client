import { describe, expect, it } from "vitest";
import { stringifyRequest } from "../src/core/stringifyRequest";

describe("stringifyRequest", () => {
  it("builds path from 3 args", () => {
    expect(stringifyRequest(["catalog", "movie", "top"])).toBe("/catalog/movie/top.json");
  });

  it("appends encoded extra query object", () => {
    expect(stringifyRequest(["catalog", "series", "top", { search: "the office", skip: 1 }])).toBe(
      "/catalog/series/top/search=the%20office&skip=1.json",
    );
  });

  it("drops empty extra object", () => {
    expect(stringifyRequest(["catalog", "movie", "top", {}])).toBe("/catalog/movie/top.json");
  });

  it("supports repeated array values", () => {
    expect(stringifyRequest(["catalog", "movie", "top", { genre: ["Action", "Drama"] }])).toBe(
      "/catalog/movie/top/genre=Action&genre=Drama.json",
    );
  });

  it("throws for invalid arg count", () => {
    expect(() => stringifyRequest(["meta", "movie"])).toThrow();
    expect(() => stringifyRequest(["a", "b", "c", {}, "x"] as unknown[])).toThrow();
  });
});
