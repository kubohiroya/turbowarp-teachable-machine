import {TMExtension, type TMExtensionDependencies} from './extension.js';

export function requireUnsandboxed(): void {
  if (!Scratch.extensions.unsandboxed) {
    throw new Error(
      'Teachable Machine must run without the extension sandbox. In TurboWarp\'s custom ' +
        'extension dialog, paste the JavaScript into the Text tab or load ' +
        'teachable-machine.js from the Files tab with "Run without sandbox" enabled.'
    );
  }
}

export function registerExtension(dependencies: TMExtensionDependencies = {}): void {
  requireUnsandboxed();
  const extension = new TMExtension({}, dependencies);
  Scratch.extensions.register(extension);
  if (Scratch.vm?.runtime) {
    Scratch.vm.runtime.ext_kubohiroyatm = extension;
  }
}
