日本語 | [English](README.en.md)

# 拡張操作用スキル

[extension-operations/SKILL.md](extension-operations/SKILL.md)は、エージェントがこの拡張の状態取得・カウンター更新を行うための操作手順です。有効な機能に応じて、画面・デバイス入口・AI依頼の案内も含みます。操作には利用先xangiの`extension_request`を使います。

スキルの説明と本文は、他の拡張と合わせて日本語で生成します。`name`・拡張ID・capability・APIパスは機械処理用の識別子を保持します。

## 生成・カスタマイズ

コピー先の拡張リポジトリのルートで`npm run configure -- ...`を実行すると、拡張ID・capability・有効機能に合わせてSKILL.mdを生成します。configureはこのREADMEを変更しません。

生成済みSKILL.mdは再実行で上書きされます。用途に合わせた操作は[雛形](../templates/extension-operations.SKILL.md)と[生成処理](../scripts/skill.mjs)へ反映し、再生成してください。

## 導入・更新

利用先workspaceへは`extension-operations/`の内容を、生成ファイルのfrontmatterの`name`に対応するディレクトリへ配置します。拡張の登録だけではスキルは導入されません。

配置先・同名衝突の確認、エージェントでの再検出、状態取得による確認、設定変更後の更新は[セットアップの導入手順](../XANGI_SETUP.md#操作用スキルの導入)を参照してください。このREADMEはリポジトリ内の案内で、操作スキルの導入時にコピーする必要はありません。
