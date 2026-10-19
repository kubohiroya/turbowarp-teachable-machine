import {normalizeBundleIndentation} from './vite-indent-plugin.js';
import {defineConfig} from 'vite';
import {turboWarpExtension} from '@kubohiroya/vite-plugin-turbowarp-extension';
import {extensionConfig} from './src/config.js';

export default defineConfig({
  plugins: [
    normalizeBundleIndentation(),
    turboWarpExtension({
      id: extensionConfig.id,
      name: extensionConfig.name,
      description: extensionConfig.description,
      author: extensionConfig.author,
      license: extensionConfig.license,
      fileName: `${extensionConfig.slug}.js`
    })
  ]
});
