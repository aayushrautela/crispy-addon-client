import { describe, expect, it } from "vitest";
import { AddonCollection, type AddonDescriptor, fromDescriptor } from "../src";

const DESCRIPTORS: AddonDescriptor[] = [
  {
    manifest: { id: "org.test.a", resources: ["meta"], types: ["movie"] },
    transportUrl: "https://example.com/a/manifest.json",
    flags: { installed: true },
  },
  {
    manifest: { id: "org.test.b", resources: ["catalog"], types: ["series"] },
    transportUrl: "https://example.com/b/manifest.json",
    flags: { installed: false },
  },
];

describe("AddonCollection", () => {
  it("loads and saves addon descriptors", async () => {
    const collection = new AddonCollection();
    await collection.load(DESCRIPTORS);

    expect(collection.getAddons()).toHaveLength(2);
    expect(collection.save()).toEqual(DESCRIPTORS);
  });

  it("supports includes/add/remove/clone", async () => {
    const addonA = await fromDescriptor(DESCRIPTORS[0]!);
    const addonB = await fromDescriptor(DESCRIPTORS[1]!);

    const collection = new AddonCollection([addonA]);
    expect(collection.includes(addonA)).toBe(true);
    expect(collection.includes(addonB)).toBe(false);

    collection.add(addonB);
    expect(collection.getAddons()).toHaveLength(2);

    collection.remove(addonA);
    expect(collection.includes(addonA)).toBe(false);
    expect(collection.getAddons()).toHaveLength(1);

    const clone = collection.clone();
    expect(clone.save()).toEqual(collection.save());
  });
});
