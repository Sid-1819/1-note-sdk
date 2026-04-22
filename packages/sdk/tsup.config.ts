import { defineConfig } from "tsup";

const shared = {
  sourcemap: true as const,
  treeshake: true as const,
};

export default defineConfig([
  {
    ...shared,
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
  },
  {
    ...shared,
    entry: ["src/cli.ts"],
    format: ["esm"],
    dts: false,
    clean: false,
    platform: "node",
    target: "node18",
    banner: {
      js: "#!/usr/bin/env node\n",
    },
    /** Runtime resolve; avoids bundling issues with clipboard binaries. */
    external: ["clipboardy"],
  },
]);
