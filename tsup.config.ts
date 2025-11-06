import { defineConfig } from "tsup";

export default defineConfig((opts) => ({
  entry: ["src/**/*.ts"],
  format: ["esm", "cjs"],
  outDir: "build",
  sourcemap: true,
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  skipNodeModulesBundle: true,
  // tsconfig: "./tsconfig.json",
  external: ["react-native-udp", "react"],
  ignoreWatch: ["node_modules/**/*", "build/**/*"],
  watch: true,
}));
