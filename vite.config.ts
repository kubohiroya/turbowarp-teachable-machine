import {normalizeBundleIndentation} from './vite-indent-plugin.js';
import {configDefaults, defineConfig} from 'vitest/config';
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
  ],
  test: {
    // Tool artifacts, not this project's tests. `.claude/worktrees/<name>` holds a whole second
    // checkout of this repository, so the default globs sweep up its `tests/` as well and report
    // both trees as one run -- a doubled count, and a failure in either tree looking like a
    // failure of the other. Excluded here rather than left to each developer's setup, for the
    // same reason `.gitignore` lists it.
    exclude: [...configDefaults.exclude, '**/.claude/**']
  }
});
