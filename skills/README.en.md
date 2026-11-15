[日本語](README.md) | English

# Extension operation skill

[extension-operations/SKILL.md](extension-operations/SKILL.md) guides agents through status reads and counter updates for this extension. It also describes UI, device ingress, and AI requests when those features are enabled. Operations use the target xangi instance's `extension_request` tool.

The skill description and body are generated in Japanese to match other extensions. The `name`, extension ID, capability, and API paths retain their machine-readable identifiers.

## Generation and customization

Run `npm run configure -- ...` from the root of your copied extension repository to generate SKILL.md with the selected extension ID, capability, and enabled features. Configure does not modify this README.

Regeneration overwrites SKILL.md. Adapt domain operations in the [template](../templates/extension-operations.SKILL.md) and [generator](../scripts/skill.mjs), then regenerate.

## Installation and updates

Place the contents of `extension-operations/` in the target workspace directory matching the generated frontmatter `name`. Registering the extension alone does not install the skill.

See the [setup installation instructions](../XANGI_SETUP.en.md#install-the-operation-skill) for placement and name collision checks, agent rediscovery, status verification, and updates after configuration changes. This README is a repository guide and does not need to be copied with the operation skill.
