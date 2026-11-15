import type { FixedInputEditorOptions } from '@kubohiroya/turbowarp-extension-data-editor';
export declare const fixedInputEditors: readonly FixedInputEditorOptions[];
/**
 * Register only currently declared opcodes; release obsolete feature-flag scopes.
 * Loading a project disposes the runtime, which releases the registrations, but the extension
 * stays loaded for the next project: they are registered again once that project has loaded.
 * Only the owner's dispose is final.
 */
export declare function fixedInputRegistration(scratch: unknown): {
    ensure(opcodes: readonly string[]): void;
    dispose: () => void;
};
