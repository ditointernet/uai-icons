import { defineConfig } from 'tsup';
import packageJSON from './package.json' with { type: 'json' };
const { peerDependencies } = packageJSON;

export default defineConfig((options) => {
  return {
    entry: ['src/index.ts'],
    outDir: './',
    dts: true,
    shims: true,
    treeshake: true,
    clean: false,
    minify: !options.watch,
    format: ['esm', 'cjs'],
    external: Object.keys(peerDependencies),
  };
});