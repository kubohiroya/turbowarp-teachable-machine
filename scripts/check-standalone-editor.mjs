import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// Use a separate Chrome profile with a fake camera; never attach to a personal browser session.
const debugUrl = process.env.TEACHABLE_MACHINE_CDP_URL ?? 'http://127.0.0.1:9222';
const modelUrl = 'https://teachablemachine.withgoogle.com/models/R9i0aRHth/';
const reportPath = process.env.TEACHABLE_MACHINE_TEST_REPORT ??
  join(tmpdir(), 'teachable-machine-editor-results.json');
const packageMetadata = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const targets = await (await fetch(`${debugUrl}/json/list`)).json();
const target = targets.find((entry) => entry.type === 'page');
assert(target, 'Open a blank page in the test browser first.');
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, {once: true});
  socket.addEventListener('error', reject, {once: true});
});

let nextId = 0;
const pending = new Map();
let requests = [];
let errors = [];
let chooser;
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  const operation = pending.get(message.id);
  if (operation) {
    pending.delete(message.id);
    clearTimeout(operation.timer);
    if (message.error) operation.reject(new Error(JSON.stringify(message.error)));
    else operation.resolve(message.result);
  } else if (message.method === 'Page.fileChooserOpened') {
    chooser = message.params;
  } else if (message.method === 'Network.requestWillBeSent') {
    requests.push(message.params.request.url);
  } else if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params.exceptionDetails.exception?.description ??
      message.params.exceptionDetails.text);
  }
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 65_000);
    pending.set(id, {resolve, reject, timer});
    socket.send(JSON.stringify({id, method, params}));
  });
}

async function evaluate(expression, awaitPromise = false) {
  const result = await send('Runtime.evaluate', {
    expression, awaitPromise, returnByValue: true, userGesture: true, timeout: 60_000
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function waitFor(expression, milliseconds = 30_000) {
  const deadline = Date.now() + milliseconds;
  while (Date.now() < deadline) {
    try {
      if (await evaluate(expression)) return;
    } catch {
      // Navigation briefly destroys the previous execution context.
    }
    await delay(250);
  }
  throw new Error(`Timeout waiting for ${expression}`);
}

async function clickText(text) {
  await evaluate(`(() => {
    const element = [...document.querySelectorAll('*')].filter(element =>
      element.children.length === 0 && element.textContent === ${JSON.stringify(text)} &&
      element.getClientRects().length).at(-1);
    if (!element) throw new Error('Missing visible text: ' + ${JSON.stringify(text)});
    element.click();
  })()`);
}

const results = [];
try {
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.enable');
  const browser = await send('Browser.getVersion');

  for (const backend of ['wasm', 'webgpu']) {
    for (const method of ['text', 'file']) {
      console.log(`Checking ${backend} through ${method}...`);
      const path = fileURLToPath(new URL(`../dist/teachable-machine-${backend}.js`, import.meta.url));
      const source = await readFile(path, 'utf8');
      await send('Page.navigate', {url: 'https://turbowarp.org/editor?lang=ja'});
      await waitFor(`!!window.vm && !!document.querySelector('button[title="拡張機能を追加"]')`, 45_000);
      await evaluate(`document.querySelector('button[title="拡張機能を追加"]').click()`);
      await waitFor(`document.body.innerText.includes('カスタム拡張機能')`);
      await evaluate(`(() => {
        const element = [...document.querySelectorAll('*')].find(element =>
          element.children.length === 0 && element.textContent === 'カスタム拡張機能');
        element.parentElement.parentElement.parentElement.click();
      })()`);
      await waitFor(`document.body.innerText.includes('カスタム拡張機能を読み込む')`);
      await clickText(method === 'text' ? 'テキスト' : 'ファイル');

      if (method === 'text') {
        await evaluate(`(() => {
          const area = document.querySelector('textarea');
          Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
            .set.call(area, ${JSON.stringify(source)});
          area.dispatchEvent(new Event('input', {bubbles: true}));
        })()`);
      } else {
        chooser = undefined;
        await send('Page.setInterceptFileChooserDialog', {enabled: true});
        await clickText('ファイルが選択されていません。');
        const deadline = Date.now() + 10_000;
        while (!chooser && Date.now() < deadline) await delay(100);
        assert(chooser, 'The file picker did not open.');
        await send('DOM.setFileInputFiles', {backendNodeId: chooser.backendNodeId, files: [path]});
        await send('Page.setInterceptFileChooserDialog', {enabled: false});
      }

      await waitFor(`!!document.querySelector('input[type="checkbox"]')`);
      await evaluate(`(() => {
        const checkbox = document.querySelector('input[type="checkbox"]');
        if (!checkbox.checked) checkbox.click();
      })()`);
      await waitFor(`[...document.querySelectorAll('button')].some(element =>
        element.innerText === '読み込む' && !element.disabled)`);
      requests = [];
      errors = [];
      await evaluate(`(() => {
        [...document.querySelectorAll('button')].find(element => element.innerText === '読み込む').click();
      })()`);
      await waitFor(`!!vm.runtime.ext_kubohiroyatm`);
      const startup = await evaluate(`(async () => {
        const extension = vm.runtime.ext_kubohiroyatm;
        const mode = extension.computeModeReporter();
        const selection = await extension.ensureComputeBackend();
        extension.setModelURL({URL: ${JSON.stringify(modelUrl)}});
        await extension.loadModel();
        return {mode, version: extension.versionReporter(), selection, modelLoaded: extension.isModelLoaded(),
          classes: extension.model.getClassLabels(), isolated: crossOriginIsolated};
      })()`, true);
      assert.equal(startup.mode, backend);
      assert.equal(startup.version, `${packageMetadata.version}-typescript`);
      assert.equal(startup.selection.backend, backend);
      assert(startup.modelLoaded);

      await evaluate(`(async () => {
        const extension = vm.runtime.ext_kubohiroyatm;
        globalThis.__recognitionUpdates = 0;
        const original = extension.applyPredictions;
        extension.applyPredictions = function (...args) {
          ++__recognitionUpdates;
          return original.apply(this, args);
        };
        await extension.startRecognition();
      })()`, true);
      await waitFor(`vm.runtime.ext_kubohiroyatm.isRecognizing() &&
        vm.runtime.ext_kubohiroyatm.currentPoseReporter() !== ''`);
      const before = await evaluate(`__recognitionUpdates`);
      await delay(1200);
      const recognition = await evaluate(`(() => {
        const extension = vm.runtime.ext_kubohiroyatm;
        return {label: extension.currentPoseReporter(), confidence: extension.scoreReporter(),
          predictions: extension.predictions, updates: __recognitionUpdates,
          recognizing: extension.isRecognizing(), camera: extension.isCameraRunning(),
          backend: extension.computeBackendReporter(), error: extension.lastErrorReporter(),
          preview: extension.previewCanvas?.isConnected, overlay: extension.poseOverlaySvg?.isConnected,
          threads: tf.backend()?.wasm?.tfjs.getThreadsCount()};
      })()`);
      assert(recognition.updates > before);
      assert(recognition.recognizing && recognition.camera && recognition.preview && recognition.overlay);
      assert.equal(recognition.backend, backend);
      assert.equal(recognition.error, '');
      assert.equal(Object.keys(recognition.predictions).length, startup.classes.length);
      assert(Object.values(recognition.predictions).every(Number.isFinite));
      assert(recognition.confidence >= 0 && recognition.confidence <= 1);
      assert.deepEqual(errors, []);
      const libraryRequests = requests.filter((url) => /^https?:/.test(url) &&
        /cdn\.jsdelivr\.net\/npm|backend-wasm|backend-webgpu|\.wasm(?:$|\?)/.test(url));
      assert.deepEqual(libraryRequests, []);
      results.push({backend, method, browser: browser.product, modelUrl,
        sha256: createHash('sha256').update(source).digest('hex'),
        startup, recognition, libraryRequests, errors});
      await writeFile(reportPath, JSON.stringify(results, null, 2) + '\n');
      console.log(`${backend}/${method}: ${recognition.label}, ${recognition.updates} updates; passed.`);
      await evaluate(`(async () => {
        const extension = vm.runtime.ext_kubohiroyatm;
        extension.stopRecognition();
        await extension.stopCamera();
      })()`, true);
    }
  }
  console.log(`Verified all four cases. Report: ${reportPath}`);
} finally {
  for (const operation of pending.values()) clearTimeout(operation.timer);
  socket.close();
}
