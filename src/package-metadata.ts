/**
 * The package's name, version and the versions of the libraries it bundles, filled in at build time
 * (`package-metadata.config.ts`). Only these fields reach the bundles, not the whole package.json.
 */
interface PackageMetadata {
  readonly name: string;
  readonly version: string;
  readonly devDependencies: Readonly<Record<
    | '@tensorflow/tfjs'
    | '@tensorflow/tfjs-backend-wasm'
    | '@tensorflow/tfjs-backend-webgpu'
    | '@tensorflow-models/speech-commands'
    | '@teachablemachine/image'
    | '@teachablemachine/pose',
    string
  >>;
}

declare const __TEACHABLE_MACHINE_PACKAGE__: PackageMetadata;

export const packageMetadata: PackageMetadata = __TEACHABLE_MACHINE_PACKAGE__;
