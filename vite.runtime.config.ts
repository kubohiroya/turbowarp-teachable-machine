import {defineConfig} from 'vite';
import {resolve} from 'node:path';

export default defineConfig({
  // Escape multiline strings in generated code so significant template whitespace
  // cannot appear as trailing whitespace in distribution diffs.
  esbuild: {supported: {'template-literal': false}},
  resolve: {
    alias: {
      util: resolve('src/runtime-util-shim.ts')
    }
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/runtime.ts',
      formats: ['iife'],
      name: 'TMBrowserRuntime',
      fileName: () => 'runtime.js'
    },
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2022'
  }
});
