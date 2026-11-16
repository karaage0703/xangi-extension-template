[日本語](XANGI_SETUP.md) | English

# AI-guided setup

Read README.en.md, extension.config.json, and xangi-extension.json. Inspect only environment and workspace information relevant to the user's goal. Copy the template before customization; never change the reference original.

1. Choose the extension ID, purpose, and UI/device/AI features from the request and existing preferences. Run the configure script in the copied repository. Do not ask again about choices the user has already made.
2. Identify the target workspace and instance. Keep durable data outside replaceable source. Preserve existing explicit destinations. Back up and compare old data before migration and retain a restoration path; never interpret an empty fresh store as successful migration.
3. For device ingress, use the ID-specific environment prefix printed by configure to set a distinct device token through the local secret/environment mechanism. For AI, use the parent host by default and an optional named agent. Configure a different destination only when explicitly requested. Do not print or transmit secret values.
4. Run npm ci, npm test, and npm run build in the copied repository. Inspect current instance CLI help using its supplied absolute path. Register the local manifest, start only this ID, and check status/doctor within the user's authorized scope.
5. Verify the counter survives a restart, optional UI is reachable, enabled device input authenticates correctly, and enabled AI returns a final response. Real AI/device checks require the corresponding configured environment; report mock-only coverage honestly.
6. Install the operation skill into the target workspace using the instructions below and verify its commands against the configuration.
7. Report actual settings, durable data scope, results, and unknowns. Treat publication, unrelated configuration, external delivery, and destructive cleanup beyond the user's request separately.

Extend this document with actual domain configuration, stable API operations, migration invariants, and verified host versions. Do not require the user to hand-edit files when the AI can perform authorized configuration and verification.

## Install the operation skill

`npm run configure -- ...` generates `skills/extension-operations/SKILL.md` alongside the configuration and manifest. It follows the extension ID, capability, and enabled features, overwriting the same file on subsequent runs. Customize domain operations in `templates/extension-operations.SKILL.md` and `scripts/skill.mjs`, then regenerate.

Prefer `xs-xxx` for skill names (for example, `xs-counter` for the `xangi-counter` extension). Skill names are separate from extension IDs. User preferences and existing skill names take precedence; installed skills are not automatically renamed, moved, or deleted. Running `configure` again updates the source template. Check its frontmatter `name` and destination name before updating an installed copy.

Check the target workspace's skill discovery conventions and use the generated frontmatter `name` as the destination directory name. For ID `xangi-counter`, copy the source `skills/extension-operations/` directory to `<workspace>/skills/xs-counter/`. Generated skill names default to `xs-xxx`, omitting the leading `xangi-` from the extension ID. Runs of dots and hyphens in IDs become a single hyphen in skill names. Inspect existing skills before copying; do not overwrite an unrelated skill. If different IDs map to the same skill name, adjust the template and destination name to distinguish them.

Rediscover the skill in the target agent (start a new conversation if needed), then compare its name, ID, capability, and features with the manifest. Replace `"$XANGI_CLI"` in examples with the supplied absolute CLI path or set that shell variable to it. Read help, then use the skill's `/api/status` operation to verify the ID and state. Extension registration alone does not install workspace skills.

Regenerate and update the installed copy after ID, feature, or API changes. When renaming an ID, inspect the old skill's purpose and usage before replacing it so stale operations do not remain. Skill availability does not expand the user's authorization for updates or external delivery.
