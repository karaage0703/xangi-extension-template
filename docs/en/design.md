[日本語](../design.md) | English

# Architecture, authentication, and persistence

## Components

This managed HTTP service uses only Node.js 22 standard libraries. `scripts/xangi-extension` launches `src/main.mjs`, which configures `src/server.mjs` with the workspace and service bearer supplied by the host. It listens on an automatically assigned loopback port and emits readiness JSON. stdin EOF, SIGTERM, and SIGINT shut it down.

- `src/config.mjs`: configuration validation, ID-specific environment settings, manifest generation.
- `src/server.mjs`: HTTP authentication, base APIs, selected feature loading, shutdown.
- `src/storage.mjs`: storage validation, counter reads, updates, and persistence.
- `src/features/ui.mjs`: counter UI and optional AI request form.
- `src/features/device.mjs`: authenticated device-message ingress.
- `src/features/ai.mjs`: host requests, SSE results, cancellation, session closure.
- `scripts/configure.mjs`: updates `extension.config.json` and `xangi-extension.json`.

UI, device ingress, and AI are independent; only enabled modules load. Disabling UI removes its manifest declaration and routes. Counter persistence is included in the base example; this does not make storage mandatory for extensions in general.

## Authentication and request flow

Host-to-service HTTP requests authenticate with `XANGI_EXTENSION_AUTH_TOKEN`. The `/ui` entry hands off to the host service proxy, and assets/APIs use relative URLs. Adapt colors and components to the task.

Inside xangi, the host owns shared Home/Back/Forward controls; this sample adds no duplicate shared navigation. Use one display-name heading without repeated decorative labels or explanations restating the action. With `data-xangi-embedded`, remove the centered outer container and use the host content area. Standalone views retain a bounded reading width. These are sample defaults that can be adapted to the task.

Devices authenticate to the host with their own token. The service checks both the forwarded managed bearer and `X-Xangi-Device-Authorization`. Receiving text alone does not start AI work.

AI runs only through a user-requested `POST /api/ai`. Omitting the agent delegates selection to the host. An alternative destination never inherits the parent's credentials. Created sessions close on success, failure, cancellation, and timeout; disconnect/shutdown abort pending work.

## Persistence and updates

`state.json` holds schemaVersion and counter. The default path is `<workspace>/.<extension-id>/<instance-hash>/state.json`, using the first 16 hexadecimal characters of the instance ID's SHA-256. The ID-specific DATA_DIR can select an absolute path. Source-local paths and invalid stored state fail startup instead of silently overwriting existing data.

Updates are serialized. A temporary file is renamed before updating the in-memory value. `scripts/prepare-update` prepares locked dependencies, tests, and build checks. See [usage](usage.md) for migration invariants and verification.

## Host features and coverage

The host needs schema-2 managed HTTP, readiness validation, authenticated forwarding, and `update.prepare` for repository updates. Selected features also need UI proxying, device authorization forwarding, or AI APIs. This example does not generate `agentBackend` or composer UI declarations.

Template tests cover config/manifest agreement, authentication, storage/restart retention, and disabled features. Host repository tests connect all eight combinations to its parser, proxy, and a mock AI host. Mocks do not verify real AI providers or physical devices. Record the tested host version and unknowns in the project's setup instructions.

On phones, show a compact app name while leaving room for actions and results. Keep the name in document.title and the main region accessible name. Do not add an empty shared header with no controls.
