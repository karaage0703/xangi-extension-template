export function aiClient(env, request = fetch) {
  const raw = env.EXTENSION_AI_HOST_URL || env.XANGI_EXTENSION_HOST_URL;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('AI requires the parent host URL or an explicit ID-specific AI_HOST_URL.');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error(
      'AI host must be an HTTP(S) origin without credentials, query, fragment, or path.'
    );
  }
  const base = url.origin;
  const headers = { 'Content-Type': 'application/json', Origin: base };
  const hostToken =
    env.EXTENSION_HOST_TOKEN || (!env.EXTENSION_AI_HOST_URL ? env.XANGI_TOKEN : undefined);
  if (hostToken) headers.Authorization = `Bearer ${hostToken}`;
  const timeout = 60000;
  async function call(path, body, signal) {
    const response = await request(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      redirect: 'error',
      signal,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Host request failed (${response.status}).`);
    }
    return response;
  }
  return {
    destination: base,
    agentId: env.EXTENSION_AGENT_ID || '',
    async describe() {
      const signal = AbortSignal.timeout(3000);
      if (env.EXTENSION_AGENT_ID) {
        const response = await call('/api/agents', undefined, signal);
        const agent = (await response.json()).agents?.find(
          (value) => value.id === env.EXTENSION_AGENT_ID
        );
        if (!agent) throw new Error('Selected agent is unavailable.');
        return { name: agent.name, backend: agent.backend, model: agent.model || '' };
      }
      const response = await call('/api/runtime-settings', undefined, signal);
      const value = (await response.json()).backend?.value;
      if (!value?.backend) throw new Error('Host default agent is unavailable.');
      return { name: 'Host default', backend: value.backend, model: value.model || '' };
    },
    async run(message, signal) {
      const bounded = AbortSignal.any([signal, AbortSignal.timeout(timeout)]);
      let session;
      try {
        const created = await call(
          '/api/sessions',
          {
            projectId: null,
            ...(env.EXTENSION_AGENT_ID ? { agentId: env.EXTENSION_AGENT_ID } : {}),
          },
          bounded
        );
        const data = await created.json();
        if (typeof data.sessionId !== 'string' || !data.sessionId || data.sessionId.length > 200)
          throw new Error('Host did not return a session ID.');
        session = data.sessionId;
        const response = await call('/api/chat', { appSessionId: session, message }, bounded);
        if (!response.body) throw new Error('Host returned no stream.');
        const reader = response.body.getReader(),
          decoder = new TextDecoder();
        let buffer = '',
          bytes = 0;
        try {
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            bytes += chunk.value.byteLength;
            if (bytes > 1024 * 1024) throw new Error('Host response is too large.');
            buffer += decoder.decode(chunk.value, { stream: true });
            let match;
            while ((match = /\r?\n\r?\n/.exec(buffer))) {
              const frame = buffer.slice(0, match.index);
              buffer = buffer.slice(match.index + match[0].length);
              const lines = frame.split(/\r?\n/);
              const event = lines
                .find((line) => line.startsWith('event:'))
                ?.slice(6)
                .trim();
              const payload = lines
                .filter((line) => line.startsWith('data:'))
                .map((line) => line.slice(5).trimStart())
                .join('\n');
              if (event === 'error') throw new Error('Host AI execution failed.');
              if (event === 'done') {
                const result = JSON.parse(payload);
                if (typeof result.response !== 'string' || !result.response.trim())
                  throw new Error('Host returned no final response.');
                return result.response;
              }
            }
          }
          throw new Error('Host stream ended without a final response.');
        } finally {
          await reader.cancel().catch(() => {});
        }
      } finally {
        if (session) {
          // Cleanup must stop our own session without masking its result or error.
          try {
            await (
              await call(
                `/api/sessions/${encodeURIComponent(session)}/close`,
                { force: true },
                AbortSignal.timeout(3000)
              )
            ).body?.cancel();
          } catch {}
        }
      }
    },
  };
}
