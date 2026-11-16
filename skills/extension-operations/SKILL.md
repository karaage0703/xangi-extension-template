---
name: xs-example-extension
description: "xangi拡張example-extensionの状態取得・カウンター更新を行う。この拡張を対象とする操作依頼で使う。"
---

# example-extensionを操作する

利用者の依頼範囲で、導入済みの`example-extension`拡張の状態を確認・操作する。
このファイルはconfigureで生成する。APIを変更した場合は、元リポジトリの`templates/extension-operations.SKILL.md`と`scripts/skill.mjs`へ反映し、再生成して導入先も更新する。

## xangi経由で操作する

利用先instanceから案内されたCLIの絶対パスを使う。以下の`"$XANGI_CLI"`はそのパスへ置換するか、同名のシェル変数へ設定する。操作前に現在のhelpを確認する。

```sh
"$XANGI_CLI" tool help extension_request
"$XANGI_CLI" tool extension_request --id example-extension --capability example-extension.manage --path /api/status
```

データを変更する前に、返された`id`・`features`・カウンターを確認する。拡張が未登録・停止中、またはリクエストが失敗した場合はエラーを報告し、CLIのhelpからセットアップ・状態の確認方法を調べる。依頼なしに登録・再起動したり、別instanceを変更したりしない。
管理用の認証は本体が扱う`extension_request`を使う。サービストークンを読み出したり、内部ポートへ直接接続したりしない。

## カウンターを更新する

依頼された場合、永続化されるカウンターを1回増やす。

```sh
"$XANGI_CLI" tool extension_request --id example-extension --capability example-extension.manage --path /api/counter --method POST --body-json '{}'
```

返されたカウンターを確認する。更新がtimeoutした場合は、再試行の前に状態を取得する。すでに更新が適用されている可能性がある。

## 画面を開く

manifestはcapability `example-extension.manage`の画面入口として`/ui`を宣言する。利用先本体の拡張ナビゲーションから開く。管理用の認証情報をブラウザのURLへ含めない。

## 結果を報告する

実行した操作と確認できた結果、エラー、実機・実AIで未確認の範囲を報告する。スキルが利用可能でも、公開・外部送信・設定変更・無関係な操作の許可にはならない。
