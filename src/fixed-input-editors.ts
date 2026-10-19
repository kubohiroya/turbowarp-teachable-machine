import {parseFixedNumberInput} from '@kubohiroya/turbowarp-extension-data-editor';
import type {FixedInputBinding, FixedInputEditorOptions, JsonValue, LiteralValue} from '@kubohiroya/turbowarp-extension-data-editor';
import {fixedInputBundle} from './fixed-input-schema.js';

const existingNumber = (value: LiteralValue): number => {
  if ((typeof value !== 'number' && typeof value !== 'string') ||
      (typeof value === 'string' && value.trim() === '')) throw new TypeError('Expected a numeric literal.');
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError('Expected a finite number.');
  return number;
};
const newNumber = (value: JsonValue): string => {
  const parsed = parseFixedNumberInput(value);
  if (parsed.kind !== 'valid') throw new TypeError('Invalid new numeric input.');
  return parsed.token;
};
const aliases: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "setRecognitionMode.MODE": {
    "pose": "pose",
    "poses": "pose",
    "body": "pose",
    "image": "image",
    "images": "image",
    "object": "image",
    "card": "image",
    "marker": "image",
    "audio": "audio",
    "sound": "audio",
    "voice": "audio",
    "microphone": "audio",
    "mic": "audio",
    "ポーズ": "pose",
    "姿勢": "pose",
    "画像": "image",
    "物体": "image",
    "カード": "image",
    "記号": "image",
    "音声": "audio",
    "音": "audio",
    "声": "audio",
    "マイク": "audio"
  },
  "setPreviewPosition.POSITION": {
    "左上": "top-left",
    "右上": "top-right",
    "左下": "bottom-left",
    "右下": "bottom-right",
    "中央": "center",
    "ステージ全体": "full-stage",
    "top-left": "top-left",
    "top-right": "top-right",
    "bottom-left": "bottom-left",
    "bottom-right": "bottom-right",
    "center": "center",
    "full-stage": "full-stage"
  },
  "setPreviewMirroring.MIRRORING": {
    "mirrored": "mirrored",
    "unmirrored": "unmirrored",
    "mirror": "mirrored",
    "normal": "unmirrored",
    "左右反転": "mirrored",
    "そのまま": "unmirrored"
  },
  "setPoseOverlayVisibility.VISIBILITY": {
    "on": "on",
    "off": "off",
    "show": "on",
    "hide": "off",
    "true": "on",
    "false": "off",
    "表示": "on",
    "非表示": "off"
  },
  "setPoseConfidenceScaling.STATE": {
    "on": "on",
    "off": "off",
    "show": "on",
    "hide": "off",
    "true": "on",
    "false": "off",
    "表示": "on",
    "非表示": "off"
  },
  "setComputeMode.MODE": {
    "auto": "auto",
    "automatic": "auto",
    "default": "auto",
    "fastest": "auto",
    "自動": "auto",
    "おまかせ": "auto",
    "webgpu": "webgpu",
    "gpu": "webgpu",
    "webgl": "webgl",
    "wasm": "wasm",
    "webassembly": "wasm",
    "simd": "wasm",
    "cpu": "cpu",
    "javascript": "cpu"
  }
};

function binding(opcode: string, argument: string, values?: readonly string[]): FixedInputBinding {
  return {argument, schemaBundle: fixedInputBundle(opcode, argument),
    control: values ? {kind: 'enum', choices: values.map(value => ({value}))} : {kind: 'number'},
    read(value) {
      if (!values) return existingNumber(value);
      if (typeof value !== 'string') throw new TypeError('Expected a string.');
      return projectEnum(opcode, argument, value);
    },
    encode(value) {
      if (!values) return newNumber(value);
      if (typeof value !== 'string' || !values.includes(value)) throw new TypeError('Invalid selection.');
      return value;
    },
    validateCandidate(value) {
      try {
        if (!values) existingNumber(value);
        else if (typeof value !== 'string' || !values.includes(value)) throw new TypeError('Invalid selection.');
        return [];
      } catch {return [{message: 'Invalid fixed input.'}];}
    }};
}

function projectEnum(opcode: string, argument: string, value: string): string {
  const key = `${opcode}.${argument}`;
  const token = argument === 'POSITION' ? value : value.trim().toLowerCase();
  return aliases[key]?.[token] ?? value;
}

export const fixedInputEditors: readonly FixedInputEditorOptions[] = [
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-setRecognitionMode', opcodes: ['kubohiroyatm_setRecognitionMode'],
    contractId: 'turbowarp-teachable-machine/setRecognitionMode', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('setRecognitionMode', 'MODE', ["pose", "image", "audio"])]},
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-setComputeMode', opcodes: ['kubohiroyatm_setComputeMode'],
    contractId: 'turbowarp-teachable-machine/setComputeMode', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('setComputeMode', 'MODE', ["auto", "webgpu", "webgl", "wasm", "cpu"])]},
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-setPreviewOpacity', opcodes: ['kubohiroyatm_setPreviewOpacity'],
    contractId: 'turbowarp-teachable-machine/setPreviewOpacity', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('setPreviewOpacity', 'OPACITY')]},
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-setPreviewPosition', opcodes: ['kubohiroyatm_setPreviewPosition'],
    contractId: 'turbowarp-teachable-machine/setPreviewPosition', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('setPreviewPosition', 'POSITION', ["top-left", "top-right", "bottom-left", "bottom-right", "center", "full-stage"])]},
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-setPreviewMirroring', opcodes: ['kubohiroyatm_setPreviewMirroring'],
    contractId: 'turbowarp-teachable-machine/setPreviewMirroring', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('setPreviewMirroring', 'MIRRORING', ["mirrored", "unmirrored"])]},
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-setPoseOverlayVisibility', opcodes: ['kubohiroyatm_setPoseOverlayVisibility'],
    contractId: 'turbowarp-teachable-machine/setPoseOverlayVisibility', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('setPoseOverlayVisibility', 'VISIBILITY', ["on", "off"])]},
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-setPoseJointStyle', opcodes: ['kubohiroyatm_setPoseJointStyle'],
    contractId: 'turbowarp-teachable-machine/setPoseJointStyle', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('setPoseJointStyle', 'PART', ["nose", "leftEye", "rightEye", "leftEar", "rightEar", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee", "leftAnkle", "rightAnkle"]), binding('setPoseJointStyle', 'OPACITY'), binding('setPoseJointStyle', 'RADIUS')]},
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-setPoseBoneStyle', opcodes: ['kubohiroyatm_setPoseBoneStyle'],
    contractId: 'turbowarp-teachable-machine/setPoseBoneStyle', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('setPoseBoneStyle', 'OPACITY'), binding('setPoseBoneStyle', 'WIDTH')]},
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-setPoseOverlayMinimumConfidence', opcodes: ['kubohiroyatm_setPoseOverlayMinimumConfidence'],
    contractId: 'turbowarp-teachable-machine/setPoseOverlayMinimumConfidence', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('setPoseOverlayMinimumConfidence', 'CONFIDENCE')]},
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-setPoseConfidenceScaling', opcodes: ['kubohiroyatm_setPoseConfidenceScaling'],
    contractId: 'turbowarp-teachable-machine/setPoseConfidenceScaling', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('setPoseConfidenceScaling', 'PROPERTY', ["joint-opacity", "joint-radius", "bone-opacity", "bone-width"]), binding('setPoseConfidenceScaling', 'STATE', ["on", "off"])]},
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-setAccumulatedPoseParameters', opcodes: ['kubohiroyatm_setAccumulatedPoseParameters'],
    contractId: 'turbowarp-teachable-machine/setAccumulatedPoseParameters', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('setAccumulatedPoseParameters', 'ACCUMULATION'), binding('setAccumulatedPoseParameters', 'DECAY')]},
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-setAccumulatedPoseThreshold', opcodes: ['kubohiroyatm_setAccumulatedPoseThreshold'],
    contractId: 'turbowarp-teachable-machine/setAccumulatedPoseThreshold', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('setAccumulatedPoseThreshold', 'THRESHOLD')]},
  {apiVersion: 1, extensionId: 'kubohiroyatm', editorId: 'fixed-isPoseWithThreshold', opcodes: ['kubohiroyatm_isPoseWithThreshold'],
    contractId: 'turbowarp-teachable-machine/isPoseWithThreshold', contractRevision: '1',
    validationContext: () => ({consumerId: 'turbowarp-teachable-machine', nowMs: 0, settings: null}),
    bindings: [binding('isPoseWithThreshold', 'THRESHOLD')]},
];

interface OptionalHost {
  gui?: {blockEditors?: {apiVersion?: number; registerFixedInputEditor?: (options: FixedInputEditorOptions) => () => void}};
  vm?: {runtime?: {on?: (event: string, listener: () => void) => void; off?: (event: string, listener: () => void) => void}};
}

/** Register only currently declared opcodes; release obsolete feature-flag scopes. */
export function fixedInputRegistration(scratch: unknown) {
  const host = (typeof scratch === 'object' && scratch !== null ? scratch : {}) as OptionalHost;
  let active: unknown;
  let activeOpcodes = '';
  const removers: (() => void)[] = [];
  let disposed = false;
  const dispose = () => {
    host.vm?.runtime?.off?.('RUNTIME_DISPOSED', shutdown);
    for (const remove of removers.splice(0).reverse()) remove();
    active = undefined; activeOpcodes = '';
  };
  const shutdown = () => {disposed = true; dispose();};
  return {
    ensure(opcodes: readonly string[]) {
      const api = host.gui?.blockEditors;
      const signature = [...new Set(opcodes)].sort().join('\0');
      if (disposed || (api === active && signature === activeOpcodes)) return;
      dispose();
      if (api?.apiVersion !== 1 || typeof api.registerFixedInputEditor !== 'function') return;
      try {
        for (const definition of fixedInputEditors) {
          if (definition.opcodes.every(opcode => opcodes.includes(opcode))) {
            const remove = api.registerFixedInputEditor.call(api, definition);
            if (typeof remove !== 'function') throw new TypeError('Invalid fixed registration cleanup.');
            removers.push(remove);
          }
        }
        active = api; activeOpcodes = signature;
        host.vm?.runtime?.on?.('RUNTIME_DISPOSED', shutdown);
      } catch (error) {dispose(); throw error;}
    },
    dispose: shutdown
  };
}
