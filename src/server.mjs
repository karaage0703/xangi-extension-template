import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { openState } from './storage.mjs';
import { environmentFor } from './config.mjs';

async function readBody(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] || ''))
    throw new Error('Use application/json.');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > 8192) throw new Error('Request is too large.');
    chunks.push(chunk);
  }
  const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected a JSON object.');
  return value;
}

export async function createExtensionServer({ config, root, workspace, token, env = process.env }) {
  env = environmentFor(config, env);
  if (!token || token.length < 32)
    throw new Error('Start through xangi: XANGI_EXTENSION_AUTH_TOKEN is required.');
  if (config.features.device && env.EXTENSION_DEVICE_TOKEN === token)
    throw new Error('Device and managed service tokens must be different.');
  const expected = Buffer.from(`Bearer ${token}`);
  const ui = config.features.ui ? await import('./features/ui.mjs') : null;
  const device = config.features.device
    ? (await import('./features/device.mjs')).deviceInput(env)
    : null;
  const ai = config.features.ai ? (await import('./features/ai.mjs')).aiClient(env) : null;
  const store = await openState(root, workspace, config, env);
  const active = new Set();
  const server = createServer(async (request, response) => {
    function send(status, value, type = 'application/json') {
      if (response.destroyed) return;
      response.writeHead(status, {
        'Content-Type': type,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(type === 'application/json' ? JSON.stringify(value) : value);
    }
    const supplied = Buffer.from(String(request.headers.authorization || ''));
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      send(401, { error: 'Unauthorized' });
      return;
    }
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      if (request.method === 'GET' && path === '/health') {
        send(200, { ready: true });
        return;
      }
      if (request.method === 'GET' && path === '/api/status') {
        const agent = ai
          ? await ai.describe().catch(() => ({ error: 'AI status unavailable' }))
          : null;
        send(200, {
          ...store.snapshot(),
          id: config.id,
          displayName: config.displayName,
          features: config.features,
          ...(ai ? { ai: { destination: ai.destination, agentId: ai.agentId, agent } } : {}),
        });
        return;
      }
      if (request.method === 'POST' && path === '/api/counter') {
        await readBody(request);
        send(200, await store.increment());
        return;
      }
      if (ui && request.method === 'GET' && path === '/ui') {
        send(
          200,
          '<!doctype html><script>location.replace(new URL("./service/",location.href).href)</script>',
          'text/html; charset=utf-8'
        );
        return;
      }
      if (ui && request.method === 'GET' && path === '/') {
        send(200, ui.html, 'text/html; charset=utf-8');
        return;
      }
      if (ui && request.method === 'GET' && path === '/ui.js') {
        send(200, ui.javascript, 'text/javascript; charset=utf-8');
        return;
      }
      if (device && request.method === 'POST' && path === '/device/message') {
        if (!device.authenticate(request)) {
          send(401, { error: 'Invalid device token' });
          return;
        }
        send(200, device.receive(await readBody(request)));
        return;
      }
      if (ai && request.method === 'POST' && path === '/api/ai') {
        const body = await readBody(request);
        if (typeof body.message !== 'string' || !body.message.trim() || body.message.length > 4000)
          throw new Error('AI message must contain 1-4000 characters.');
        const controller = new AbortController();
        active.add(controller);
        const closed = () => {
          if (!response.writableEnded) controller.abort();
        };
        response.once('close', closed);
        try {
          send(200, { response: await ai.run(body.message, controller.signal) });
        } finally {
          active.delete(controller);
          response.removeListener('close', closed);
        }
        return;
      }
      send(404, { error: 'Not found or feature disabled' });
    } catch (error) {
      send(400, { error: error.message });
    }
  });
  return {
    server,
    async close() {
      for (const controller of active) controller.abort();
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      });
      await store.close();
    },
  };
}
