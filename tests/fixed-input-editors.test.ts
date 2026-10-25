import {TMExtension} from '../src/extension.js';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createFixedInputEditor, type FixedBlockSnapshot, type FixedInputEditorOptions, type JsonObject, type LiteralValue} from '@kubohiroya/turbowarp-extension-data-editor';
import {fixedInputEditors, fixedInputRegistration} from '../src/fixed-input-editors.js';
import canonicalSchema from '../schemas/block-editor-fixed-inputs.schema.json' with {type: 'json'};

const literal = (value: LiteralValue) => ({kind: 'literal' as const, value});
function snapshot(options: FixedInputEditorOptions, args?: FixedBlockSnapshot['arguments']): FixedBlockSnapshot {
  const arguments_ = args ?? Object.fromEntries(options.bindings.map(binding => [binding.argument, literal(String(binding.control?.choices?.[0]?.value ?? '1'))]));
  return {targetId: 'target', blockId: 'block', opcode: options.opcodes[0]!, revision: '1', arguments: arguments_,
    fixedContext: {contractId: options.contractId, contractRevision: options.contractRevision, generation: '1',
      readOnlyArguments: [], dependencies: [], inputs: Object.fromEntries(options.bindings.map(binding => [binding.argument,
        {role: 'editable', source: arguments_[binding.argument]?.kind === 'reporter' ? 'reporter' : 'shadow', identity: binding.argument,
          ...(arguments_[binding.argument]?.kind === 'reporter' ? {} : {field: {blockId: binding.argument, name: 'NUM', type: 'math_number'}})}]))}};
}
const changeEditors = new WeakMap<FixedInputEditorOptions, ReturnType<typeof createFixedInputEditor>>();
function change(options: FixedInputEditorOptions, argument: string, value: LiteralValue, raw?: LiteralValue) {
  const current = snapshot(options);
  if (raw !== undefined) (current.arguments as Record<string, ReturnType<typeof literal>>)[argument] = literal(raw);
  let editor = changeEditors.get(options);
  if (!editor) {editor = createFixedInputEditor(options);changeEditors.set(options, editor);}
  const draft = editor.readFixed(current) as JsonObject;
  const edited = structuredClone(draft) as {inputs: Record<string, {value: LiteralValue; changed: boolean}>};
  edited.inputs[argument] = {value, changed: true};
  return editor.prepareFixedSave(edited, current);
}
function option(opcode: string) {return fixedInputEditors.find(o => o.opcodes[0]!.endsWith(`_${opcode}`))!;}

describe('fixed owner contracts', () => {
  it('covers exactly 18 writable arguments and resolves every canonical source pointer', () => {
    let count = 0;
    for (const definition of fixedInputEditors) for (const binding of definition.bindings) {
      let selected: unknown = canonicalSchema;
      for (const part of binding.schemaBundle.root.artifact.source.symbol!.slice(2).split('/')) selected = (selected as Record<string, unknown>)[part];
      expect(selected).toEqual(binding.schemaBundle.root.document);count++;
    }
    expect(count).toBe(18);
  });
  it('saves every fixed enum choice without touching any unbound argument', () => {
    for (const definition of fixedInputEditors) for (const binding of definition.bindings) {
      for (const choice of binding.control?.choices ?? []) {
        const result = change(definition, binding.argument, String(choice.value), '__unknown-old__');
        expect(result).toMatchObject({kind: 'ready', changes: [{argument: binding.argument, value: choice.value}]});
        expect(change(definition, binding.argument, '__new-unknown__').kind).toBe('invalid');
      }
    }
  });
  it('applies NP grammar to every new number, including programmatic changes without a buffer', () => {
    for (const definition of fixedInputEditors) for (const binding of definition.bindings.filter(b => b.control?.kind === 'number')) {
      for (const value of ['1e2', '0.5', '9007199254740993']) expect(change(definition, binding.argument, value)).toMatchObject({kind: 'ready', changes: [{argument: binding.argument, value}]});
      for (const value of ['0x10', '+1', '001', '1.', '', ' ', 'NaN', 'Infinity', '1e']) expect(change(definition, binding.argument, value).kind).toBe('invalid');
    }
  });
  it('preserves legacy raw, unknown selections, blanks and reporter connections on no-op', () => {
    for (const definition of fixedInputEditors) for (const binding of definition.bindings) {
      for (const value of ['0x10', ' ', 'Infinity', '__unknown-old__', false] as const) {
        const current = snapshot(definition, {...snapshot(definition).arguments, [binding.argument]: literal(value)});
        const editor = createFixedInputEditor(definition);
        expect(editor.prepareFixedSave(editor.readFixed(current), current)).toMatchObject({kind: 'ready', changes: []});
      }
      const current = snapshot(definition, {...snapshot(definition).arguments, [binding.argument]: {kind: 'reporter'}});
      const editor = createFixedInputEditor(definition); const draft = editor.readFixed(current);
      expect(editor.describeFixed!(draft, current).inputs[binding.argument]!.state).toBe('readonly');
      expect(editor.prepareFixedSave(draft, current)).toMatchObject({kind: 'ready', changes: []});
    }
  });
  it('registers only real opcodes, rebinds changed scopes and APIs, rolls back partial failure and disposes once', () => {
    const remove = vi.fn();const register = vi.fn(() => remove);const on = vi.fn();const off = vi.fn();
    const api = {apiVersion: 1, registerFixedInputEditor: register};const host = {gui: {blockEditors: api}, vm: {runtime: {on, off}}};
    const registration = fixedInputRegistration(host);const opcodes = fixedInputEditors.flatMap(o => o.opcodes);
    registration.ensure(opcodes);registration.ensure(opcodes);expect(register).toHaveBeenCalledTimes(fixedInputEditors.length);
    registration.ensure(opcodes.slice(0, 1));expect(remove).toHaveBeenCalledTimes(fixedInputEditors.length);
    expect(register).toHaveBeenCalledTimes(fixedInputEditors.length + 1);
    host.gui.blockEditors = {apiVersion: 1, registerFixedInputEditor: vi.fn(() => remove)};registration.ensure(opcodes);
    registration.dispose();registration.dispose();expect(on).toHaveBeenCalledWith('RUNTIME_DISPOSED', expect.any(Function));
    const failedRemove = vi.fn();let count = 0;
    const failed = fixedInputRegistration({gui: {blockEditors: {apiVersion: 1, registerFixedInputEditor() {if (++count === 2) throw new Error('failed');return failedRemove;}}}});
    expect(() => failed.ensure(opcodes)).toThrow('failed');expect(failedRemove).toHaveBeenCalledTimes(1);
    expect(() => fixedInputRegistration({}).ensure(opcodes)).not.toThrow();
    for (const host of [undefined, null, false]) {const absent = fixedInputRegistration(host);expect(() => absent.ensure(opcodes)).not.toThrow();expect(() => absent.dispose()).not.toThrow();}
  });
});


afterEach(() => vi.unstubAllGlobals());
describe('Teachable Machine fixed-only runtime contract', () => {
  it('projects Japanese and legacy aliases without evaluating a model or changing raw', () => {
    for (const [opcode, argument, raw, projected] of [
      ['setRecognitionMode', 'MODE', '画像', 'image'], ['setComputeMode', 'MODE', '自動', 'auto'],
      ['setPreviewPosition', 'POSITION', '左上', 'top-left'], ['setPreviewMirroring', 'MIRRORING', 'そのまま', 'unmirrored'],
      ['setPoseOverlayVisibility', 'VISIBILITY', '表示', 'on'], ['setPoseConfidenceScaling', 'STATE', '非表示', 'off']]) {
      const options = option(opcode!);const binding = options.bindings.find(b => b.argument === argument)!;
      expect(binding.read(raw!)).toBe(projected);
      const current = snapshot(options, {...snapshot(options).arguments, [argument!]: literal(raw!)});
      const editor = createFixedInputEditor(options);expect(editor.prepareFixedSave(editor.readFixed(current), current)).toMatchObject({kind: 'ready', changes: []});
    }
    const part = option('setPoseJointStyle').bindings.find(b => b.argument === 'PART')!;
    expect(part.control?.choices?.map(c => c.value)).toContain('leftShoulder');
    expect(part.control?.choices?.map(c => c.value)).not.toContain('left_shoulder');
  });
  it('preserves runtime clamp semantics while storing the finite numeric token', () => {
    const extension = new TMExtension({poseOverlay: false, temporalPoseScoring: false});
    extension.setPreviewOpacity({OPACITY: '-2'});expect(extension.previewOpacity).toBe(0);
    extension.setAccumulatedPoseParameters({ACCUMULATION: '-2', DECAY: '2'});
    expect(extension.accumulationCoefficient).toBe(0);expect(extension.decayCoefficient).toBe(1);
    for (const [opcode, argument, value] of [['setPreviewOpacity', 'OPACITY', '-2'], ['setAccumulatedPoseParameters', 'DECAY', '2'], ['setPoseJointStyle', 'RADIUS', '-2']]) {
      expect(change(option(opcode!), argument!, value!).kind).toBe('ready');
    }
  });
  it('tracks actual feature-filtered opcodes and preserves getInfo with optional registration', () => {
    vi.stubGlobal('Scratch', {BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean', HAT: 'hat'},
      ArgumentType: {STRING: 'string', NUMBER: 'number', BOOLEAN: 'boolean'}, translate: (value: string) => value});
    for (const poseOverlay of [false, true]) for (const temporalPoseScoring of [false, true]) {
      const extension = new TMExtension({poseOverlay, temporalPoseScoring});const expected = extension.getInfo();
      const remove = vi.fn();const register = vi.fn(() => remove);
      Object.assign(Scratch, {gui: {blockEditors: {apiVersion: 1, registerFixedInputEditor: register}}});
      expect(extension.getInfo()).toEqual(expected);extension.getInfo();
      const opcodes = new Set(expected.blocks.map((b: {opcode: string}) => `kubohiroyateachablemachine_${b.opcode}`));
      expect(register.mock.calls.map(c => (c[0] as unknown as FixedInputEditorOptions).opcodes[0])).toEqual(fixedInputEditors.filter(o => opcodes.has(o.opcodes[0])).map(o => o.opcodes[0]));
      extension.featureFlags.poseOverlay = !poseOverlay;extension.getInfo();expect(remove).toHaveBeenCalled();
      Reflect.deleteProperty(Scratch, 'gui');
    }
  });
});
