import {defineConfig} from 'vite';
import {packageMetadataDefine} from './package-metadata.config.js';

export default defineConfig({
  define: packageMetadataDefine,
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/posenet.ts',
      formats: ['es'],
      fileName: () => 'posenet.js'
    },
    minify: false,
    sourcemap: false,
    target: 'es2022'
  }
});
