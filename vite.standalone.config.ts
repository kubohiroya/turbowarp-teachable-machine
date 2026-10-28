import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {defineConfig, type Plugin} from 'vite';
import {turboWarpExtension} from '@kubohiroya/vite-plugin-turbowarp-extension';
import {extensionConfig} from './src/config.js';
import {normalizeBundleIndentation} from './vite-indent-plugin.js';

const virtualId = 'virtual:teachable-machine-wasm';
const resolvedId = `\0${virtualId}`;
const factoryId = '\0teachable-machine-threaded-wasm-factory';
const factoryKey = '@kubohiroya/turbowarp-teachable-machine/threaded-wasm-factory';
const wasmNames = [
  'tfjs-backend-wasm.wasm',
  'tfjs-backend-wasm-simd.wasm',
  'tfjs-backend-wasm-threaded-simd.wasm'
];

function embeddedWasm(): Plugin {
  return {
    name: 'teachable-machine-embedded-wasm',
    enforce: 'pre',
    resolveId(id) {
      if (id === virtualId) return resolvedId;
      if (id.endsWith('/tfjs-backend-wasm-threaded-simd.js')) return factoryId;
      return null;
    },
    async load(id) {
      if (id === factoryId) {
        return `const key = Symbol.for(${JSON.stringify(factoryKey)});
          const factory = globalThis[key];
          delete globalThis[key];
          export default factory;`;
      }
      if (id !== resolvedId) return null;
      const paths: Record<string, string> = {};
      for (const name of wasmNames) {
        const path = resolve('node_modules/@tensorflow/tfjs-backend-wasm/dist', name);
        this.addWatchFile(path);
        const bytes = await readFile(path);
        paths[name] = `data:application/octet-stream;base64,${bytes.toString('base64')}`;
      }
      return `export default ${JSON.stringify(paths)};`;
    }
  };
}

export default defineConfig(async ({mode}) => {
  if (mode !== 'webgpu' && mode !== 'wasm') {
    throw new Error('Standalone extension mode must be webgpu or wasm.');
  }
  // TensorFlow serializes this factory with Function.toString() for its workers.
  // Keep the upstream source intact: bundler rewrites of its closure break that serialization.
  const factoryPath = resolve(
    'node_modules/@tensorflow/tfjs-backend-wasm/wasm-out/tfjs-backend-wasm-threaded-simd.js'
  );
  const factory = await readFile(factoryPath, 'utf8');
  const prelude = `(function () {
    const module = {exports: {}};
    const exports = module.exports;
    ${factory}
    globalThis[Symbol.for(${JSON.stringify(factoryKey)})] = module.exports;
  })();`;
  const extension = turboWarpExtension({
    ...extensionConfig,
    entry: 'src/standalone.ts',
    fileName: `${extensionConfig.slug}-${mode}.js`,
    target: 'es2022',
    minify: true,
    prelude,
    unsandboxed: 'required',
    sandboxedGuard: false
  });
  return {
    plugins: [
      embeddedWasm(),
      extension,
      {
        name: 'teachable-machine-standalone-distribution',
        // Override the extension plugin's cleanup so all variants remain available.
        config: () => ({build: {emptyOutDir: false}}),
        async generateBundle(_options, bundle) {
          const notices = await readFile('THIRD_PARTY_NOTICES.md', 'utf8');
          for (const output of Object.values(bundle)) {
            if (output.type === 'chunk') {
              output.code = `/*! @license\n${notices.replaceAll('*/', '* /')}\n*/\n${output.code}`;
            }
          }
        }
      },
      normalizeBundleIndentation()
    ],
    resolve: {alias: {util: resolve('src/runtime-util-shim.ts')}},
    define: {__TEACHABLE_MACHINE_DEFAULT_BACKEND__: JSON.stringify(mode)}
  };
});
