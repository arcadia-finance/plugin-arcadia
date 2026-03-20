import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    "@elizaos/core",
    "@elizaos/plugin-evm",
    "viem",
    "viem/accounts",
    "viem/chains",
  ],
});
