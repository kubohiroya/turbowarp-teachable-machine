import {writeFile, readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import process from 'node:process';

// Original analytic brightness classifier: each RGB mean contributes -4 / +4.
const weights = [-4, 4, -4, 4, -4, 4, 0, 0];
const bytes = new Uint8Array(weights.length * 4);
const view = new DataView(bytes.buffer);
weights.forEach((value, index) => view.setFloat32(index * 4, value, true));
const output = new URL('../samples/assets/brightness-model/weights.bin', import.meta.url);
if (process.argv.includes('--check')) assert.deepEqual(new Uint8Array(await readFile(output)), bytes);
else await writeFile(output, bytes);
