import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  environmentFor,
  envPrefix,
  loadConfig,
  manifestFor,
  validateConfig,
} from '../src/config.mjs';
import { createExtensionServer } from '../src/server.mjs';
import { aiClient } from '../src/features/ai.mjs';

const root = new URL('../', import.meta.url);

test('an explicit remote host never inherits the parent host credential', async () => {
  let authorization;
  const request = async (_url, options) => {
    authorization = options.headers.Authorization;
    return Response.json({ backend: { value: { backend: 'codex', model: 'test' } } });
  };
  const env = { EXTENSION_AI_HOST_URL: 'https://remote.example.test', XANGI_TOKEN: 'parent-only' };
  await aiClient(env, request).describe();
  assert.equal(authorization, undefined);
  await aiClient({ ...env, EXTENSION_HOST_TOKEN: 'explicit-remote-token' }, request).describe();
  assert.equal(authorization, 'Bearer explicit-remote-token');
});

test('malformed stored data is preserved and shared device/service credentials are rejected', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'extension-preserve-'));
  const token = 'shared-fixture-token-with-at-least-32';
  const config = { ...(await loadConfig(root)), features: { ui: false, device: false, ai: false } };
  const data = join(workspace, 'data');
  try {
    await mkdir(data);
    await writeFile(join(data, 'state.json'), '{invalid');
    await assert.rejects(
      createExtensionServer({
        config,
        root,
        workspace,
        token,
        env: { [envPrefix(config) + '_DATA_DIR']: data },
      }),
      /Stored state is invalid/
    );
    assert.equal(await readFile(join(data, 'state.json'), 'utf8'), '{invalid');
    await assert.rejects(
      createExtensionServer({
        config: { ...config, features: { ...config.features, device: true } },
        root,
        workspace,
        token,
        env: { [envPrefix(config) + '_DEVICE_TOKEN']: token },
      }),
      /must be different/
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('AI failures never return partial text and always close the owned session', async () => {
  for (const frame of [
    'event: text\ndata: {"fullText":"partial"}\n\n',
    'event: error\ndata: {}\n\n',
  ]) {
    const paths = [];
    const request = async (url) => {
      paths.push(url);
      if (url.endsWith('/api/sessions')) return Response.json({ sessionId: 'owned' });
      if (url.endsWith('/api/chat')) return new Response(frame);
      return Response.json({});
    };
    const client = aiClient({ XANGI_EXTENSION_HOST_URL: 'http://host.test' }, request);
    await assert.rejects(client.run('test', new AbortController().signal));
    assert.ok(paths.at(-1).endsWith('/api/sessions/owned/close'));
  }
});

test('AI cancellation closes its session with an independent cleanup signal', async () => {
  let signalAtClose;
  let chatStarted;
  const started = new Promise((resolve) => {
    chatStarted = resolve;
  });
  const request = async (url, options) => {
    if (url.endsWith('/api/sessions')) return Response.json({ sessionId: 'owned' });
    if (url.endsWith('/api/chat')) {
      return new Response(
        new ReadableStream({
          start(controller) {
            options.signal.addEventListener(
              'abort',
              () => controller.error(new Error('cancelled')),
              { once: true }
            );
            chatStarted();
          },
        })
      );
    }
    signalAtClose = options.signal;
    return Response.json({});
  };
  const controller = new AbortController();
  const running = aiClient({ XANGI_EXTENSION_HOST_URL: 'http://host.test' }, request).run(
    'test',
    controller.signal
  );
  await started;
  controller.abort();
  await assert.rejects(running, /cancelled/);
  assert.equal(signalAtClose.aborted, false);
});

test('selected config and manifest agree, with independently selectable features', async () => {
  const config = await loadConfig(root);
  assert.notEqual(envPrefix({ id: 'a-b' }), envPrefix({ id: 'a.b' }));
  assert.equal(
    environmentFor(config, { EXTENSION_DATA_DIR: '/unrelated' }).EXTENSION_DATA_DIR,
    undefined
  );
  assert.deepEqual(
    JSON.parse(await readFile(new URL('xangi-extension.json', root))),
    manifestFor(config)
  );
  for (let bits = 0; bits < 8; bits++) {
    const features = { ui: Boolean(bits & 1), device: Boolean(bits & 2), ai: Boolean(bits & 4) };
    const manifest = manifestFor({ ...config, features });
    assert.equal(Boolean(manifest.ui), features.ui);
    assert.equal(Boolean(manifest.deviceIngress), features.device);
    assert.equal(
      manifest.permissions.some((value) => value.includes('AI agent')),
      features.ai
    );
  }
  assert.throws(() => validateConfig({ ...config, id: '../escape' }), /Invalid/);
  assert.throws(
    () => validateConfig({ ...config, features: { ...config.features, extra: true } }),
    /Invalid/
  );
});

test('base HTTP authenticates requests and serializes persistent changes across restarts', async () => {
  const workspace = await mkdtemp(join(tmpdir(), 'extension-base-'));
  const config = { ...(await loadConfig(root)), features: { ui: false, device: false, ai: false } };
  const token = 'base-fixture-service-token-at-least-32';
  let app;
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      app = await createExtensionServer({ config, root, workspace, token, env: {} });
      await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
      const base = `http://127.0.0.1:${app.server.address().port}`;
      assert.equal((await fetch(base + '/health')).status, 401);
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      assert.equal((await (await fetch(base + '/health', { headers })).json()).ready, true);
      const before = await (await fetch(base + '/api/status', { headers })).json();
      assert.equal(before.counter, attempt ? 10 : 0);
      if (!attempt) {
        const changes = await Promise.all(
          Array.from({ length: 10 }, () =>
            fetch(base + '/api/counter', { method: 'POST', headers, body: '{}' })
          )
        );
        assert.ok(changes.every((response) => response.status === 200));
      }
      assert.equal((await fetch(base + '/', { headers })).status, 404);
      assert.equal(
        (await fetch(base + '/api/ai', { method: 'POST', headers, body: '{"message":"test"}' }))
          .status,
        404
      );
      await app.close();
      app = null;
    }
  } finally {
    if (app) await app.close();
    await rm(workspace, { recursive: true, force: true });
  }
});
