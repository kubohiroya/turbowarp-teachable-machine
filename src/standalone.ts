import '@tensorflow/tfjs-backend-webgpu';
import {setWasmPaths} from '@tensorflow/tfjs-backend-wasm';
import {installBrowserRuntime} from './browser-runtime.js';
import {registerExtension, requireUnsandboxed} from './register-extension.js';
import wasmPaths from 'virtual:teachable-machine-wasm';

requireUnsandboxed();

// Both optional backends share the runtime's core and are ready without downloading scripts.
const runtime = installBrowserRuntime({
  assetBase: 'embedded:',
  backendAssets: {
    loadBackend: async (backend) => backend === 'wasm' ? {setWasmPaths} : null,
    wasmAssetBase: () => wasmPaths
  }
});

registerExtension({
  ...runtime,
  computeMode: __TEACHABLE_MACHINE_DEFAULT_BACKEND__,
  allowRemoteLibraries: false
});
