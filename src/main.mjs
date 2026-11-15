import { resolve } from 'node:path';
import { loadConfig } from './config.mjs';
import { createExtensionServer } from './server.mjs';

const root = new URL('../', import.meta.url);
if (
  process.argv[2] !== 'serve' ||
  process.argv[3] !== '--workspace' ||
  !process.argv[4] ||
  process.argv.length !== 5
) {
  throw new Error('Start through xangi with serve --workspace PATH.');
}
const workspace = resolve(process.argv[4]);
const config = await loadConfig(root);
const app = await createExtensionServer({
  config,
  root,
  workspace,
  token: process.env.XANGI_EXTENSION_AUTH_TOKEN,
});
let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  try {
    await app.close();
  } catch {
    process.exitCode = 1;
  }
  process.stdin.pause();
};
process.stdin.resume();
process.stdin.on('end', stop);
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
app.server.listen(0, '127.0.0.1', () => {
  console.log(
    JSON.stringify({
      schemaVersion: 2,
      event: 'ready',
      id: config.id,
      workspace,
      baseUrl: `http://127.0.0.1:${app.server.address().port}`,
    })
  );
});
