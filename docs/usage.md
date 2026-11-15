[English](en/usage.md) | 日本語

# 使い方・設定・検証

登録・起動は[セットアップ](../XANGI_SETUP.md)、仕組みは[設計](design.md)を参照してください。

## 機能を選ぶ

既定は画面だけです。以下の3つは独立して選べます。

- `ui`: ブラウザ画面、保存されるカウンター、AIを有効にした場合の入力フォーム。
- `device`: managedサービス用とは別のデバイストークンで認証するメッセージ入口。
- `ai`: 利用者の依頼で本体へ実行を依頼。担当未指定時は本体の既定担当を使います。

```sh
npm ci
npm run configure -- --id reading-notes --name "読書メモ" --features ui,ai
npm test
npm run build
```

全部を使う場合は`--features ui,device,ai`、全部を省略する場合は`--features none`です。`configure`は選択肢を検証してから`extension.config.json`と`xangi-extension.json`を書きます。テンプレート原本では実行せず、コピー先で操作してください。サンプルの操作を用途に合うAPIとテストへ置き換えます。各機能は`src/features/`へ分けてあり、有効な機能だけを読み込みます。適応後は使わない見本を削除できます。

## 起動と永続データ

configureはIDに対応する環境変数の接頭辞を表示します。以下の`<PREFIX>_DATA_DIR`、`<PREFIX>_DEVICE_TOKEN`、`<PREFIX>_AI_HOST_URL`、`<PREFIX>_AGENT_ID`、`<PREFIX>_HOST_TOKEN`は、その接頭辞へ置換します。既定IDでは`XANGI_EXAMPLE_DASH_EXTENSION`です。ドットは`_DOT_`、ハイフンは`_DASH_`にするため別IDを区別できます。`EXTENSION_*`は内部の別名で、継承する設定ではありません。

本体は`scripts/xangi-extension`を`serve --workspace PATH`で起動します。標準出力の最初の行はreadiness JSONです。HTTPは本体から渡されたBearerで認証し、診断ログは標準エラーへ出します。stdin切断・SIGTERM・SIGINTで停止します。

既定の保存先はsourceの外にある`<workspace>/.<extension-id>/<instance-hash>/state.json`です。`<PREFIX>_DATA_DIR`で絶対パスを明示できます。source配下の保存先や不正な既存データでは、空にリセットせず起動を停止します。カウンター更新は直列化し、ファイルをatomicに置換します。形式・ID・保存単位を変える前に、移行後に保持する内容と確認方法を決めます。

repositoryからの更新では`scripts/prepare-update`でlockfileに沿う依存準備、テスト、構文・build確認を行います。起動時にも保存先を検証します。既存データがsource内にある場合、設定・移行を担当するAIがバックアップ、コピーまたは変換、内容照合、保存先選択を行います。確認が終わるまで原本を保持します。

## 画面

インストール済み本体のUIガイドを、任意の参考例として使えます。サンプルの配色や部品は必須ではありません。この例では明暗・システム設定と連動し、フォーカスやタッチ操作を確認しやすくしています。

`/ui`は本体のサービス中継へ移動します。assetとAPIは相対URLです。本体のナビゲーションを重複させていません。基本APIは`/api/status`と`POST /api/counter`です。画面を有効にすると`/`、`/ui`、`/ui.js`を追加し、無効にするとこれらを提供しません。

## デバイス入口

有効にする場合、`<PREFIX>_DEVICE_TOKEN`へ32文字以上の別のランダム値を、利用先の秘密情報・環境変数管理を通じて設定します。manifestやブラウザへ渡さないでください。

デバイスは本体の`/api/devices/<extension-id>/message`へJSON `{"text":"hello"}`を送り、デバイストークンをBearerにします。本体はmanagedサービス用Bearerと、`X-Xangi-Device-Authorization`による元の認証を転送します。テンプレートの`/device/message`で両方を検証します。サンプルは受信確認を返すだけで、実機との通信や受信文の自動AI実行は行いません。

## 本体経由のAI

通常は`XANGI_EXTENSION_HOST_URL`を使います。明示した別の接続先だけに`<PREFIX>_AI_HOST_URL`を設定します。親本体がAPI認証を要求する場合は`XANGI_TOKEN`を渡します。別接続先へ親のトークンを継承せず、`<PREFIX>_HOST_TOKEN`を別途設定します。`XANGI_EXTENSION_AUTH_TOKEN`を本体API用に流用しません。`<PREFIX>_AGENT_ID`は任意で、省略すると本体が担当を選びます。status APIは接続先と秘密を含まない担当情報だけを返します。

`POST /api/ai`は`{"message":"依頼内容"}`を受け付け、専用会話を作ってSSEの最終結果を読みます。成功・失敗・取消・timeoutのいずれでも会話を閉じ、クライアント切断と終了時に中断します。この例ではモデルへの直接接続やバックグラウンドAI実行を行いません。実行時は本体の権限と利用者の依頼範囲に従います。

## 検証と用途への適応

本体内と単体表示の両方で、開く→カウンター更新→表示の確認→再読込を試します。本体内ではホーム・戻る・進むを本体の共通ナビで操作し、重複ボタンや余計な左余白、二重の見出しがないかPC・スマホ幅で確認します。

ローカルテストではmanifestと設定の一致、8通りの機能宣言、認証、直列化した保存、再起動後の保持、無効な機能の入口を確認します。本体repositoryでは8通りの起動をパーサ・中継・模擬AI本体と組み合わせて検証します。mockの成功は実AIや実機との確認ではありません。利用先のsetup文書へ、確認した本体版・必要なAPI・未確認事項を記録します。

AIバックエンド登録（`agentBackend`）と入力欄UIは別の接続方式で、この3つの選択肢からは生成しません。追加する場合は本体のガイドを参照してください。

## 自分の用途へ置き換えるとき

サンプルのカウンターを業務用の操作へ置き換え、設定・API・検証も対応させます。再利用するコードの著作権表示とMIT許諾文は保持し、自分の追加・変更部分には適切な年と自分の名前を追記します。LICENSEはテンプレート原本の作者を示し、生成した拡張全体の作者を固定しません。[MIT本文](https://opensource.org/license/mit)を参照してください。

スマホでは小さな画面名を表示し、操作と結果の場所も確保します。名前はdocument.titleとmainのアクセシビリティ名へも設定します。操作のない空の共通ヘッダーは追加しません。
