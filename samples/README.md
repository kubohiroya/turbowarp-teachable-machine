# 最小デモ: recognize-two-labels

[Editor](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-teachable-machine%2Fsamples%2Frecognize-two-labels.sb3) · [SB3](https://kubohiroya.github.io/turbowarp-teachable-machine/samples/recognize-two-labels.sb3)

緑の旗は未開始状態です。Lで自作のDark/Light明度モデルだけを読み込み、青いStartを明示クリックするとカメラ権限を求め画像認識を開始します。SでstopCameraし、認識・プレビューを停止します。明るい/暗い無地の対象をカメラに示してラベルとscoreを確認してください。モデルはRGB平均値を使う手定義の32byte重みで、Google Teachable Machineで学習した一般画像分類モデルではありません。

要件: HTTPS・カメラ権限・対応ブラウザ / 本体既存のTeachable Machine/TensorFlow browser runtime取得通信 / 自作32byte重み・model.json・metadata・MPLライセンスをPages配信。

未検証: 実カメラのDark/Light連続認識と環境光による精度 / 実機カメラの拒否/再接続/解放。自動検証でカメラ・マイク・音声を開始しない。 実機停止はSを先に押してから停止ボタン、またはタブを閉じてください。本体はPROJECT_STOP_ALLへstopCameraを結び付けていません。モデルはタブ終了までメモリに保持します。

## 編集・生成・公開

`recognize-two-labels/project.json`とSVGを編集しNode.js 26で生成します。

```sh
node scripts/build-samples.mjs
node scripts/build-samples.mjs --check
node --test scripts/verify-samples.mjs
node scripts/prepare-pages.mjs
```

unsandboxed用JSはSB3へ同梱し、Editorの通常の許可画面を使います。依存がある場合は全ID/URLを記録し、同梱JSはlicense/revision/SHA256を保持します。自動確認は音声・実機・点滅を開始せず初期状態/安全なcancel分岐だけを検証します。未検証を成功と表現しません。

切戻し: サンプル・README・Pages追加をrevert。本体と既定フラグは変更しません。

[同梱モデルの式・編集元・ライセンス](assets/brightness-model/README.md)
