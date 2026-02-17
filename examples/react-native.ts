import { fromDescriptor } from "crispy-addon-client";

export async function loadMeta() {
  const addon = await fromDescriptor({
    manifest: {
      id: "org.example.mobile",
      resources: ["meta"],
      types: ["movie"],
    },
    transportUrl: "https://example.com/manifest.json",
  });

  return addon.get("meta", "movie", "tt0111161");
}
