日本語 | [English](README.en.md)

# example-extension

カウンターを保存・表示し、必要に応じてデバイスからのメッセージ受信や[xangi](https://github.com/karaage0703/xangi)へのAI依頼を追加できるサンプル拡張です。

## 主な機能

- カウンターの取得・更新と再起動後の保持。
- 任意のブラウザ画面、認証付きデバイス入口、本体経由のAI依頼。
- 画面・デバイス・AIは独立して選択でき、すべて省略する構成にも対応。
- 拡張ID・有効機能に追従するエージェント操作用スキルを生成。

## Quickstart

Node.js 22以上とnpmが必要です。テンプレートを開発先へコピーし、以下をコピー先で実行します。IDと表示名は作る拡張に合わせて変更してください。

新規拡張のリポジトリ名・ID・表示名は`xangi-xxx`形式（例: `xangi-counter`）を推奨します。表示名も同じ名前にそろえます。これは必須ではなく、利用者の指定や既存製品の名前を優先し、既存IDを自動で改名しません。 スキル名は`xs-xxx`形式（例: 拡張`xangi-counter`の操作スキルは`xs-counter`）を推奨します。拡張IDとは別の名前です。利用者指定や既存スキル名を優先し、導入済みスキルを自動で改名・移動・削除しません。

```sh
npm ci
npm run configure -- --id xangi-counter --name xangi-counter --features ui
npm test
npm run build
```

[セットアップ](XANGI_SETUP.md)に従って利用先xangiへ登録・起動します。既定では画面だけを有効にし、保存データはworkspace内のsourceとは別の場所へ置きます。AIやデバイスの設定と確認方法は[使い方](docs/usage.md)を参照してください。

## ドキュメント

- [セットアップ・拡張登録](XANGI_SETUP.md)
- [使い方・設定・検証](docs/usage.md)
- [構成・認証・データ管理](docs/design.md)
- [操作用スキル・生成・導入案内](skills/README.md)
- [English setup](XANGI_SETUP.en.md) / [usage](docs/en/usage.md) / [design](docs/en/design.md)

## License

MIT
