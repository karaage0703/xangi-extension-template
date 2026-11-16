[English](en/design.md) | 日本語

# 構成・認証・データ管理

## UIの文字と密度の基準（推奨）

サイズは要素の役割と隣接する文字との強弱で選び、セレクタ名だけから一括置換しません。モニターの密な一覧は既存の9〜14pxの階層を維持し、画面名20px・主要数値24pxを使います。お気に入り名は12pxです。feedの一覧はタイトル16px・抜粋14px、tasksの編集本文はPC14px・スマホ16pxを使います。一般的な長文本文16pxを、そのまま一覧の抜粋や編集ペインへ当てはめません。

本体のファイラーを基準に、画面を切り替えても一覧・操作の密度が変わりにくい既定値を使います。拡張名・アイコンは本体の拡張開発ガイドに合わせ、既存IDを自動改名しません。これは新規UI・保守時の推奨で、利用者指定と用途に合う表示を優先します。例外申請や必須SDKは不要です。

- 一覧の主文字・ボタン・ナビ・通常ラベル: 13px（`--xangi-font-ui`）。
- 日時・説明などの補足: 12px（`--xangi-font-caption`）。短い件数やバッジ: 11px（`--xangi-font-micro`）。主要情報を小さい文字へ押し込みません。
- 画面名: 18px（`--xangi-font-heading`）。節見出し: 16px（`--xangi-font-section`）。一覧を巨大な見出しで占有しません。
- 記事・メール・Markdown・会話など読む本文: 16px、行高1.6〜1.75（`--xangi-font-reading`）。長文の見出しは24/18/16pxを目安にします。
- コード・ファイル編集: 13px、等幅（`--xangi-font-code`）。グラフ等の主要数値は24px（`--xangi-font-metric`）。

UIの書体はInter、system sans-serif、Noto Sans JP等の日本語fallbackを同じ順で使います。ブラウザの文字拡大を妨げず、親iframeから全子要素へフォントを強制注入しません。各拡張が同名のCSS変数を持ち、単体でも同じ基準を使います。取り込んだレポートHTMLや外部プレビューの本文は書き換えません。

余白は4px単位、薄い境界・中立色と青の操作色、角丸6〜8pxを既存画面に合わせて使います。情報の配置・機能・読み順は維持します。スマホでは入力欄16px、操作領域44px程度を確保し、文字だけでタップ領域を決めません。画面名はPC/スマホとも18pxを基本にし、長文本文を画面幅だけで縮小しません。

PC/スマホ・明暗テーマで、実際のcomputed style、長いラベル、スクロール、フォーカス、入力と戻る操作を確認します。本体の中と単体の両方を確認し、未確認の実機条件を報告します。

## 構成

Node.js 22の標準ライブラリだけで動くmanaged HTTPサービスです。`scripts/xangi-extension`から`src/main.mjs`を起動し、本体が渡したworkspaceとサービス用Bearerで`src/server.mjs`を構成します。loopbackの自動割当portで待ち受け、readiness JSONを返します。stdin切断・SIGTERM・SIGINTで終了します。

- `src/config.mjs`: 設定の読込・検証、ID別の環境変数、manifest生成。
- `src/server.mjs`: HTTP認証、基本API、選択した機能の読込、終了処理。
- `src/storage.mjs`: 保存先の検証、カウンターの読込・更新・保存。
- `src/features/ui.mjs`: カウンターと任意のAI依頼フォーム。
- `src/features/device.mjs`: デバイスからの認証付きメッセージ受付。
- `src/features/ai.mjs`: 本体への依頼、SSE応答の回収、取消と会話終了。
- `scripts/configure.mjs`: `extension.config.json`と`xangi-extension.json`の更新。

画面・デバイス入口・AIは独立し、有効な機能だけ読み込みます。画面を無効にするとmanifestのUI宣言と画面のrouteを提供しません。カウンター保存は基本構成に含まれますが、このサンプルの選択であり、拡張一般に保存を必須とするものではありません。

## 認証と依頼の流れ

本体からサービスへのHTTP requestは`XANGI_EXTENSION_AUTH_TOKEN`で認証します。画面の`/ui`入口から本体のサービス中継へ移り、相対URLでasset・APIを読みます。配色や画面部品は用途に応じて変更できます。

本体内では共通ホーム・戻る・進むを本体に任せ、このサンプルには独自の共通ナビを置きません。表示名の見出しは1つとし、同じ名前の飾りラベルや操作を言い直す説明は追加しません。`data-xangi-embedded`がある場合は中央寄せの外枠を外し、本体の作業領域を使います。単体表示では本文幅を制限します。これらは見本の既定値であり、用途に応じて調整できます。

デバイスは専用tokenで本体へ送信し、本体が転送するmanagedサービス用Bearerと`X-Xangi-Device-Authorization`の両方を検証します。受信した文章だけで自動的にAIを起動しません。

AIは利用者からの`POST /api/ai`で本体へ依頼します。担当を指定しなければ本体に選択を任せます。別の接続先には親の認証を引き継ぎません。成功・失敗・取消・timeoutで作成した会話を閉じ、クライアント切断・終了時に処理を中断します。

## 永続データと更新

`state.json`はschemaVersionとcounterを持ちます。既定は`<workspace>/.<extension-id>/<instance-hash>/state.json`で、instance IDのSHA-256から先頭16桁を使います。ID別のDATA_DIRで絶対パスを指定することもできます。source配下を指す保存先や不正な既存データは起動失敗として扱い、初期値で上書きしません。

更新処理を直列化し、一時ファイルをrenameして保存した後にメモリ上の値を更新します。更新準備は`scripts/prepare-update`でlockfileに沿う依存準備・テスト・buildを行います。データの移行条件と確認は[使い方](usage.md)を参照してください。

## 対応機能と検証範囲

本体にはschema-2 managed HTTP、readiness検証、認証付き中継、repository更新用の`update.prepare`が必要です。選択した画面・デバイス認証転送・AI用APIにも対応している必要があります。`agentBackend`や入力欄UIはこのサンプルからは生成しません。

テンプレート内のテストは設定とmanifest、認証、保存・再起動保持、無効な機能を確認します。本体repositoryのテストは8構成をパーサ・中継・模擬AI本体へ接続します。mockは実AI・実機の確認ではありません。利用先で確認した本体版と未確認範囲はsetup文書に記録してください。

スマホでは小さな画面名を表示し、操作と結果の場所も確保します。名前はdocument.titleとmainのアクセシビリティ名へも設定します。操作のない空の共通ヘッダーは追加しません。
