import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "transports/index": "src/transports/index.ts",
    "transports/http": "src/transports/http.ts",
    "transports/ipfsShim": "src/transports/ipfsShim.ts",
    "transports/legacy": "src/transports/legacy.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2020",
  splitting: false,
  treeshake: true,
  outDir: "dist",
});
