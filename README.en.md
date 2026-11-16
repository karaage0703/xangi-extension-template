[日本語](README.md) | English

# example-extension

A sample extension that stores and displays a counter, with optional device-message ingress and AI requests through [xangi](https://github.com/karaage0703/xangi).

## Features

- Read/update the counter and retain it across restarts.
- Optional browser UI, authenticated device ingress, and host-mediated AI requests.
- UI, device ingress, and AI can be selected independently or all omitted.
- Generated agent operation skill follows the extension ID and enabled features.

## Quickstart

Requires Node.js 22+ and npm. Copy the template to your development repository and run the following in the copy. Change the ID and display name to match your extension.

For new extensions, prefer the `xangi-xxx` form for the repository name, ID, and display name (for example, `xangi-counter`). Keep the display name consistent too. This is optional: user preferences and existing product names take precedence, and existing IDs are not renamed automatically. Prefer `xs-xxx` for skill names (for example, `xs-counter` for the `xangi-counter` extension). Skill names are separate from extension IDs. User preferences and existing skill names take precedence; installed skills are not automatically renamed, moved, or deleted.

```sh
npm ci
npm run configure -- --id xangi-counter --name xangi-counter --features ui
npm test
npm run build
```

Follow [setup](XANGI_SETUP.en.md) to register and start it in the target xangi. Only UI is enabled by default, with persistent data stored under the workspace outside the source directory. See [usage](docs/en/usage.md) for AI/device configuration and checks.

## Documentation

- [Setup and extension registration](XANGI_SETUP.en.md)
- [Usage, configuration, and verification](docs/en/usage.md)
- [Architecture, authentication, and data management](docs/en/design.md)
- [Operation skill, generation, and installation guide](skills/README.en.md)
- [Japanese setup](XANGI_SETUP.md) / [usage](docs/usage.md) / [design](docs/design.md)

## License

MIT
