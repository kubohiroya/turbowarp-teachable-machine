import type { FixedInputEditorOptions } from '@kubohiroya/turbowarp-extension-data-editor';
export declare const fixedInputEditors: readonly FixedInputEditorOptions[];
/** Register only currently declared opcodes; release obsolete feature-flag scopes. */
export declare function fixedInputRegistration(scratch: unknown): {
    ensure(opcodes: readonly string[]): void;
    dispose: () => void;
};
