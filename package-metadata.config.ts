import packageJson from './package.json' with {type: 'json'};

/**
 * The parts of package.json the bundles use, and nothing else.
 *
 * Importing package.json itself put the whole manifest in every bundle, scripts and devDependencies
 * included. Each family dependency update then changed `dist/` without changing what it does, so a
 * release that only followed a dependency could not be recognised as unchanged.
 */
const bundledDependencies = [
  '@tensorflow/tfjs',
  '@tensorflow/tfjs-backend-wasm',
  '@tensorflow/tfjs-backend-webgpu',
  '@tensorflow-models/speech-commands',
  '@teachablemachine/image',
  '@teachablemachine/pose'
] as const;

const devDependencies: Record<string, string> = packageJson.devDependencies;

export const packageMetadataDefine = {
  __TEACHABLE_MACHINE_PACKAGE__: JSON.stringify({
    name: packageJson.name,
    version: packageJson.version,
    devDependencies: Object.fromEntries(bundledDependencies.map(name => {
      const range = devDependencies[name];
      if (!range) throw new Error(`package.json has no devDependency ${name}`);
      return [name, range];
    }))
  })
};
