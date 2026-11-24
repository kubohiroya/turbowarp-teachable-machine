import {normalizeBundleIndentation} from './vite-indent-plugin.js';
import {defineConfig} from 'vite';
import {packageMetadataDefine} from './package-metadata.config.js';

export default defineConfig({
  define: packageMetadataDefine,
  plugins: [normalizeBundleIndentation()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/composition.ts',
      formats: ['es'],
      fileName: () => 'composition.js'
    },
    minify: false,
    sourcemap: false,
    target: 'es2022'
  }
});
