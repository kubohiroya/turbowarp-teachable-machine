# 単一ファイル版の導入と検証

標準の TurboWarp Editor で、次のいずれか1つを読み込みます。

| 成果物 | 初期計算モード | ライブラリ・WASMバイナリ |
|---|---|---|
| `dist/teachable-machine-webgpu.js` | `webgpu` | 内包 |
| `dist/teachable-machine-wasm.js` | `wasm` | 内包 |
| `dist/teachable-machine.js` | `auto` | 必要時にネット取得 |

- 「カスタム拡張機能」→「テキスト」では、ファイルの全文を貼り付けて「サンドボックスなしで実行する」を有効にします。
- 「ファイル」では、同じJavaScriptファイルを選択し、同じ設定を有効にします。
- WebGPU版とWASM版はどちらも全バックエンドを含みます。初期モード以外への切り替え・フォールバックでも、追加のライブラリやWASMバイナリは取得しません。
- 利用者のTeachable Machineモデルと、Poseモードで使うPoseNetの重みは別途取得します。完全オフラインのモデルパッケージではありません。
- 拡張ID `kubohiroyatm`、opcode、既存のruntime API名は互換性のため維持します。

## 2026-10-28 の検証

Chrome 156.0.8078.48で公式の `https://turbowarp.org/editor` を開き、4.0.2の配布成果物について次の4通りを確認しました。WASMは5スレッドで動作しました。

| 成果物 | テキストから読み込み | ファイルから読み込み | 実際の計算方式 |
|---|---|---|---|
| WebGPU版 | モデル読み込み・連続認識成功 | モデル読み込み・連続認識成功 | `webgpu` |
| WASM版 | モデル読み込み・連続認識成功 | モデル読み込み・連続認識成功 | `wasm`（並列動作） |

検証モデルは公開Poseモデル
[`R9i0aRHth`](https://teachablemachine.withgoogle.com/models/R9i0aRHth/) です。
クラスは `Tilt Left`、`Tilt Right`、`No Tilt` です。Chromeの仮想カメラを使い、モデルを差し替えずに、
拡張の通常のカメラ開始・モデル読み込み・認識ループを動かしました。

4通りとも、認識結果のラベルと有限の信頼度が連続更新され、カメラプレビューとPoseオーバーレイが接続されること、
実際のバックエンドが要求と一致すること、`last error`とブラウザ例外が空であることを確認しました。
ライブラリCDNおよび外部WASMファイルのリクエストは0件でした。
人の動作に対する分類精度、バックエンド間の数値一致、物理カメラや全対応ブラウザはこの確認の対象外です。

別途、外部HTTPリクエストを拒否するlocalhostの分離環境でも、両版の畳み込みとWASMへの切り替えが成功しました。
並列WASMのワーカーが生成元の関数を文字列化するため、ビルドでは上流のfactoryソースをそのまま保持しています。

## 再実行

事前にビルドを完了させ、作業用のChromeを空の専用プロファイルで起動します。
以下はmacOSの例です。普段使うChromeのプロファイルでは実行しないでください。

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/teachable-machine-editor-check \
  --no-first-run \
  --no-default-browser-check \
  --enable-unsafe-webgpu \
  --use-fake-device-for-media-stream \
  --use-fake-ui-for-media-stream \
  about:blank
```

別のターミナルから、リポジトリのルートで実行します。

```sh
node scripts/check-standalone-editor.mjs
```

スクリプトは実際のEditorのダイアログを操作します。「テキスト」では全文を入力し、
「ファイル」ではChromeのファイル選択ダイアログにローカル成果物を渡します。
両方で「サンドボックスなしで実行する」を有効にします。
その後、モデルを読み込み、認識が複数回更新されることを検査します。

`TEACHABLE_MACHINE_CDP_URL`で接続先を変更できます。
結果はOSの一時ディレクトリの `teachable-machine-editor-results.json` に保存されます。
`TEACHABLE_MACHINE_TEST_REPORT`で保存先を変更できます。
結果にはChromeのバージョン、実際のバックエンド、認識結果、各成果物のSHA-256が含まれます。
物理WebGPUを使えずフォールバックした場合は、WebGPU確認に成功したとは扱わず検査を失敗させます。
公開モデルやEditorのUIに依存するため、この検査はローカルで必要時に実行する補助検証です。

## 切り戻し

認識を停止してEditorを開き直し、軽量版 `teachable-machine.js` を読み込みます。
既存の軽量版の初期モードは引き続き `auto` です。内包版の使用は、利用者がファイルを選ぶことで明示的に有効になります。
配布名の変更自体を取り消す場合は、ビルドslug、packageのexports/CDN入口、CI/releaseの成果物、導入文書を一緒に戻します。
