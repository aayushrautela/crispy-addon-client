import { describe, expect, it } from "vitest";
import { ERR_NO_TRANSPORT, AddonClient, fromDescriptor } from "../src";

describe("fromDescriptor", () => {
  it("creates an immutable AddonClient from descriptor", async () => {
    const descriptor = {
      manifest: {
        id: "org.test.descriptor",
        name: "Descriptor Addon",
        resources: ["meta"],
        types: ["movie"],
      },
      transportUrl: "https://example.com/manifest.json",
      flags: {
        official: true,
      },
    };

    const addon = await fromDescriptor(descriptor);
    expect(addon).toBeInstanceOf(AddonClient);
    expect(addon.toDescriptor()).toEqual(descriptor);

    const originalName = addon.manifest.name;
    try {
      (addon.manifest as { name?: string }).name = "mutated";
    } catch {
      // expected on strict runtimes
    }

    expect(addon.manifest.name).toBe(originalName);
  });

  it("throws ERR_NO_TRANSPORT for unsupported transport URLs", async () => {
    await expect(
      fromDescriptor({
        manifest: { id: "org.test.invalid" },
        transportUrl: "ftp://example.com/manifest.json",
      }),
    ).rejects.toMatchObject({ code: ERR_NO_TRANSPORT });
  });
});
