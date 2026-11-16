import { readFile } from 'node:fs/promises';
import { manifestFor } from '../src/config.mjs';

export async function skillFor(config) {
  const manifest = manifestFor(config);
  const capability = manifest.capabilities[0].id;
  const request = `"$XANGI_CLI" tool extension_request --id ${config.id} --capability ${capability}`;
  const sections = [];
  if (config.features.ui) {
    sections.push(`
## 画面を開く

manifestはcapability \`${capability}\`の画面入口として\`/ui\`を宣言する。利用先本体の拡張ナビゲーションから開く。管理用の認証情報をブラウザのURLへ含めない。`);
  }
  if (config.features.device) {
    sections.push(`
## デバイスからメッセージを送る

本体の\`/api/devices/${config.id}/message\`でデバイス入口を利用できる。設定済みデバイスから専用のBearerを使い、JSON \`{"text":"hello"}\`を送る。サンプルは受信確認だけを返す。管理用サービストークンで代用せず、利用者の依頼なしに実デバイスの通信を送らない。`);
  }
  if (config.features.ai) {
    sections.push(`
## AIへ依頼する

状態には実効のAI接続先と担当が含まれる。確認してから、利用者が依頼したテキストを設定済みの接続先・担当へ送る。

\`\`\`sh
${request} --path /api/ai --method POST --body-json '{"message":"カウンターの例を要約してください"}'
\`\`\`

結果の\`response\`に最終応答が入る。途中の出力を成功扱いせず、失敗はそのまま報告する。timeoutしたAI依頼を自動で再送しない。`);
  }
  const values = {
    SKILL_NAME: `xs-${config.id.replace(/[.-]+/g, '-').replace(/^xangi-/, '')}`,
    DESCRIPTION: JSON.stringify(`xangi拡張${config.id}の状態取得・カウンター更新${config.features.ai ? '・利用者の依頼によるAI実行' : ''}を行う。この拡張を対象とする操作依頼で使う。`),
    ID: config.id,
    CAPABILITY: capability,
    FEATURE_OPERATIONS: sections.join('\n'),
  };
  const template = await readFile(new URL('../templates/extension-operations.SKILL.md', import.meta.url), 'utf8');
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Unknown skill template field: ${key}`);
    return values[key];
  });
}
