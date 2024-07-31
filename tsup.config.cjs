import { defineConfig } from 'tsup';
import packageJSON from './package.json' with { type: 'json' };
const { peerDependencies } = packageJSON;

export default defineConfig((options) => {
  return {
    entry: ['src/index.ts'],
    dts: true,
    shims: true,
    treeshake: true,
    clean: true,
    minify: !options.watch,
    format: ['esm', 'cjs'],
    external: Object.keys(peerDependencies),
  };
});