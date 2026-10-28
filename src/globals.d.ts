interface TurboWarpExtension {
  getInfo(): Record<string, unknown>;
}

interface ScratchApi {
  extensions: {
    unsandboxed: boolean;
    register(extension: TurboWarpExtension): void;
  };
  vm?: {
    runtime?: {
      emit(eventName: string, payload: unknown): void;
      ext_kubohiroyatm?: {
        supportsAccumulatedPoseEvents(): boolean;
      };
    };
  };
  BlockType: Record<'COMMAND' | 'REPORTER' | 'BOOLEAN' | 'HAT', string>;
  ArgumentType: Record<'STRING' | 'NUMBER' | 'BOOLEAN', string>;
  translate(
    value: string | {default: string; description?: string},
    placeholders?: Record<string, string | number>
  ): string;
}

declare const Scratch: ScratchApi;
declare const tmPose: any;
declare const tmImage: any;
declare const tmAudio: any;
declare const tmCompute: any;
declare const __TEACHABLE_MACHINE_DEFAULT_BACKEND__: 'webgpu' | 'wasm';

declare module 'virtual:teachable-machine-wasm' {
  const paths: Record<string, string>;
  export default paths;
}
