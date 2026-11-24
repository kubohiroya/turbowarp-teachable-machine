import {defineConfig} from 'vite';
import {packageMetadataDefine} from './package-metadata.config.js';

/**
 * The optional WebGPU backend resolves TensorFlow.js against the one instance
 * the reviewed browser runtime already published as `globalThis.tf`, so the
 * bundle never carries a second copy of TensorFlow.js core.
 */
export default defineConfig({
  define: packageMetadataDefine,
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/backend-webgpu.ts',
      formats: ['iife'],
      name: 'TMBackendWebGPU',
      fileName: () => 'backend-webgpu.js'
    },
    rollupOptions: {
      external: ['@tensorflow/tfjs-core'],
      output: {globals: {'@tensorflow/tfjs-core': 'tf'}}
    },
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2022'
  }
});
