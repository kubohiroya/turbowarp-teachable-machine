import document from '../schemas/block-editor-fixed-inputs.schema.json' with {type: 'json'};
import type {SchemaBundle, SchemaDocument} from '@kubohiroya/turbowarp-extension-data-editor/schema';

/** Owner canonical fragments, distinct from older SOURCE/editor schemas. */
export function fixedInputBundle(opcode: string, argument: string): SchemaBundle {
  const source = {repository: 'turbowarp-teachable-machine', path: 'schemas/block-editor-fixed-inputs.schema.json',
    symbol: `#/$defs/${opcode}/properties/${argument}`};
  const fragment = (document.$defs as Record<string, {properties: Record<string, SchemaDocument>}>)[opcode]!.properties[argument]!;
  return {identity: {ownerId: 'turbowarp-teachable-machine', contractId: 'fixed-inputs', revision: '1', variantId: `${opcode}.${argument}`},
    dialect: '2020-12', root: {retrievalUri: document.$id, document: fragment, artifact: {role: 'canonical-schema', source}}, resources: [],
    provenance: {canonicalSources: [source, {repository: 'turbowarp-teachable-machine', path: 'src/extension.ts', symbol: opcode}],
      generatedFiles: [], referenceSchemas: [], generationSources: []}};
}
export const fixedSchemas = document.$defs;
