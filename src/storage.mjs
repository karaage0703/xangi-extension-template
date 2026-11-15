import { mkdir, readFile, writeFile, rename, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, sep } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export async function openState(root, workspace, config, env) {
  const instance = createHash('sha256')
    .update(env.XANGI_EXTENSION_INSTANCE_ID || 'default')
    .digest('hex')
    .slice(0, 16);
  const path = env.EXTENSION_DATA_DIR || resolve(workspace, `.${config.id}`, instance);
  if (!isAbsolute(path))
    throw new Error('The ID-specific DATA_DIR setting must be an absolute persistent path.');
  const source = await realpath(fileURLToPath(root));
  function outsideSource(value) {
    const rel = relative(source, value);
    return rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel);
  }
  if (!outsideSource(resolve(path)))
    throw new Error(
      'Persistent data must be outside extension source. Choose the ID-specific DATA_DIR setting or a separate workspace.'
    );
  await mkdir(path, { recursive: true, mode: 0o700 });
  if (!outsideSource(await realpath(path)))
    throw new Error('Persistent data must not resolve into extension source.');
  const file = resolve(path, 'state.json');
  let state = { schemaVersion: 1, counter: 0 };
  try {
    state = JSON.parse(await readFile(file, 'utf8'));
    if (state.schemaVersion !== 1 || !Number.isSafeInteger(state.counter) || state.counter < 0)
      throw new Error('Invalid stored state.');
  } catch (error) {
    if (error.code !== 'ENOENT')
      throw new Error('Stored state is invalid; restore or migrate it instead of resetting.');
  }
  let pending = Promise.resolve();
  return {
    snapshot: () => ({ ...state }),
    increment() {
      const operation = pending.then(async () => {
        const next = { ...state, counter: state.counter + 1 };
        if (!Number.isSafeInteger(next.counter)) throw new Error('Counter limit reached.');
        const temporary = `${file}.${randomUUID()}.tmp`;
        await writeFile(temporary, JSON.stringify(next) + '\n', { mode: 0o600 });
        await rename(temporary, file);
        state = next;
        return { ...state };
      });
      pending = operation.catch(() => {});
      return operation;
    },
    async close() {
      await pending;
    },
  };
}
