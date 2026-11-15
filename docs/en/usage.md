[日本語](../usage.md) | English

# Usage, configuration, and verification

See [setup](../../XANGI_SETUP.en.md) for registration/startup and [design](design.md) for the implementation.

## Choose features

The default enables UI only. All three choices are independent:

- `ui`: a browser page, persistent counter, and optional AI form.
- `device`: a device message endpoint with a device token separate from the managed service token.
- `ai`: user-requested execution through the configured xangi host, defaulting to the host's agent.

```sh
npm ci
npm run configure -- --id reading-notes --name "Reading notes" --features ui,ai
npm test
npm run build
```

Use `--features ui,device,ai` for every example or `--features none` for a headless base. `configure` validates choices before writing `extension.config.json`, `xangi-extension.json`, and the operation skill `skills/extension-operations/SKILL.md`. See [setup](../../XANGI_SETUP.en.md#install-the-operation-skill) for workspace installation and updates. Do not run it on the reference original. Replace example operations with domain operations and add tests for them. Feature modules are separate under `src/features/` and loaded only when enabled; unused examples can be removed after adapting the project and checks.

## Runtime and persistent data

The configure command prints an environment prefix derived from the extension ID. Below, `<PREFIX>_DATA_DIR`, `<PREFIX>_DEVICE_TOKEN`, `<PREFIX>_AI_HOST_URL`, `<PREFIX>_AGENT_ID`, and `<PREFIX>_HOST_TOKEN` use that printed prefix. The default ID produces `XANGI_EXAMPLE_DASH_EXTENSION`; dots use `_DOT_` and hyphens use `_DASH_`, so different IDs remain distinct. Generic `EXTENSION_*` names are internal aliases, not inherited settings.

The host starts `scripts/xangi-extension` with `serve --workspace PATH`. The first stdout line is readiness JSON. HTTP requests require the injected managed bearer. Logs belong on stderr. stdin EOF, SIGTERM, and SIGINT shut down the process.

Default storage is `<workspace>/.<extension-id>/<instance-hash>/state.json`, outside the extension source. `<PREFIX>_DATA_DIR` can explicitly select an absolute persistent directory. A source-local directory or malformed stored state fails startup rather than silently resetting. The example serializes counter updates and replaces the state file atomically. Define and verify domain-specific migration invariants before changing formats, IDs, or storage scope.

Repository-managed updates run `scripts/prepare-update`: locked dependency preparation, tests, and syntax/build checks. The runtime also validates storage after an update. Existing source-local data must be backed up, copied or converted, compared, and selected explicitly by the AI performing setup/migration. Keep originals until verification completes.

## UI

See the installed host UI guide for optional starting points, not mandatory styles or components. The example shares light/dark/system preferences and uses the host neutral palette with visible focus and touch controls.

The declared `/ui` entry hands off to the host's service proxy; assets and API requests are relative. The page contains no duplicate host navigation. The base API exposes `/api/status` and `POST /api/counter`. The UI feature adds `/`, `/ui`, and `/ui.js`; disabling it removes those routes.

## Device ingress

When enabled, set `<PREFIX>_DEVICE_TOKEN` to a distinct random value of at least 32 characters through the authorized local secret/environment mechanism. Do not store it in the manifest or send it to browsers.

The device sends JSON `{"text":"hello"}` to the host's `/api/devices/<extension-id>/message` with its device token as the bearer. xangi supplies the managed service bearer and forwards the original device authorization in `X-Xangi-Device-Authorization`. This template validates both layers at `/device/message`. The example acknowledges the message; it does not contact hardware or automatically submit device text to AI.

## Host-mediated AI

When enabled, `XANGI_EXTENSION_HOST_URL` is the normal destination. Set `<PREFIX>_AI_HOST_URL` only for an explicit alternative origin. If the parent host requires an API bearer, provide `XANGI_TOKEN`. An explicit remote destination never inherits that parent token; configure `<PREFIX>_HOST_TOKEN` for its credentials instead; never reuse `XANGI_EXTENSION_AUTH_TOKEN` as a host API token. `<PREFIX>_AGENT_ID` is optional; omission delegates agent selection to xangi. The status API reports only the destination and non-secret agent metadata.

`POST /api/ai` accepts `{"message":"your request"}`. It creates its own session, reads the final SSE result, and closes its session on success, failure, cancellation, or timeout. Client disconnection and shutdown abort the request. There is no direct model connection or background AI invocation in this example. Actual execution uses the host's permissions and the user's requested scope.

## Verification and adaptation

Check both embedded and standalone views: open, increment, verify the displayed value, and reload. In the host, use its shared Home/Back/Forward controls. Inspect desktop and mobile widths for duplicate navigation, extra outer gutters, and repeated headings.

Local tests verify selected manifest/config agreement, all eight feature declarations, authentication, serialized persistence, restart retention, and disabled endpoints. The host repository additionally tests all eight running combinations against its manifest parser, proxy, and a mock AI host. Mock tests are not verification with a real AI provider or physical device. Record the tested host version, required APIs, and unknowns in your project's setup document after integration.

AI backend registration (`agentBackend`) and composer contributions are different integration contracts; they are not generated by these three switches. Consult the host guide before adding them.

## Adapting the example

Replace the counter with domain operations and update configuration, APIs, and checks accordingly. Preserve the original copyright notice and MIT permission text in reused code; add the appropriate year and your own name for your contributions. The LICENSE identifies the template's original author, not the author of every derived extension. See the [MIT text](https://opensource.org/license/mit).

On phones, show a compact app name while leaving room for actions and results. Keep the name in document.title and the main region accessible name. Do not add an empty shared header with no controls.
