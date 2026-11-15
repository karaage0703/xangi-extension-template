export const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Example extension</title>
<style>
:root{color-scheme:light;--canvas:#f7f6f3;--surface:#fff;--ink:#37352f;--muted:#686763;--line:#d8d7d4;--accent:#155f9f;--on-accent:#fff;--font:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans JP",sans-serif}
:root[data-theme="dark"]{color-scheme:dark;--canvas:#202020;--surface:#191919;--ink:#efefed;--muted:#aaa9a5;--line:#40403d;--accent:#8dc6f3;--on-accent:#191919}
*{box-sizing:border-box}html,body{margin:0;overflow-x:clip}body{color:var(--ink);background:var(--canvas);font:16px/1.6 var(--font)}main{max-width:56rem;margin:auto;padding:24px}h1{margin:0 0 16px;font-size:21px;line-height:1.3;overflow-wrap:anywhere}p,pre{overflow-wrap:anywhere}button,textarea{font:inherit;color:inherit}button{min-height:44px;padding:8px 14px;border:1px solid var(--accent);border-radius:6px;background:var(--accent);color:var(--on-accent);cursor:pointer}button:hover{filter:brightness(.95)}button:disabled{opacity:.6;cursor:wait}textarea{display:block;width:100%;min-height:100px;margin:8px 0;padding:10px;border:1px solid var(--line);border-radius:6px;background:var(--surface)}button:focus-visible,textarea:focus-visible{outline:2px solid var(--accent);outline-offset:3px}pre{white-space:pre-wrap}#status{color:var(--muted)}form{margin-top:24px}@media(max-width:600px){main{padding:16px}}
/* Inside xangi, use its content area without another centered outer gutter. */
:root[data-xangi-embedded="true"] main{max-width:none;margin:0;padding:20px 28px}
@media(max-width:768px){:root[data-xangi-embedded="true"] main{padding:16px}}
@media(max-width:900px){#name{font-size:18px;margin:0 0 16px}}
</style></head>
<body><main><h1 id="name">Example extension</h1><p id="status" role="status"></p><button id="increment">Increment saved counter</button><p id="counter"></p>
<form id="ai" hidden><label>Ask the configured xangi AI<textarea id="message" required maxlength="4000"></textarea></label><button>Ask AI</button></form><pre id="result"></pre></main><script src="./ui.js"></script></body></html>`;

export const javascript = `// Same-origin xangi appearance preference; no writes during initialization.
(() => {
  const media = matchMedia('(prefers-color-scheme: dark)');
  const preference = () => { try { return localStorage.getItem('xangi-theme'); } catch { return null; } };
  const apply = () => {
    const selected = preference();
    const dark = selected === 'dark' || (selected !== 'light' && media.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  };
  apply();
  media.addEventListener('change', apply);
  window.addEventListener('storage', event => { if (event.key === 'xangi-theme' || event.key === null) apply(); });
})();

const get = id => document.getElementById(id);
async function api(path, body) {
  const response = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const value = await response.json(); if (!response.ok) throw new Error(value.error || 'Request failed'); return value;
}
function failure(error) { get('result').textContent = error.message; }
async function refresh() {
  const state = await api('./api/status'); get('name').textContent = state.displayName; document.title = state.displayName; get('name').closest('main').setAttribute('aria-label', state.displayName);
  get('counter').textContent = 'Saved counter: ' + state.counter; get('ai').hidden = !state.features.ai;
  get('status').textContent = state.ai ? 'AI destination: ' + state.ai.destination + ' / ' + Object.values(state.ai.agent).join(' / ') : 'Ready';
}
get('increment').onclick = async () => { try { await api('./api/counter', {}); await refresh(); } catch (error) { failure(error); } };
get('ai').onsubmit = async event => {
  event.preventDefault(); const button = get('ai').querySelector('button'); button.disabled = true;
  try { get('result').textContent = (await api('./api/ai', { message: get('message').value })).response; } catch (error) { failure(error); } finally { button.disabled = false; }
};
refresh().catch(failure);`;
