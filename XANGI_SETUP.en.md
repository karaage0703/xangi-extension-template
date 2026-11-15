[日本語](XANGI_SETUP.md) | English

# AI-guided setup

Read README.en.md, extension.config.json, and xangi-extension.json. Inspect only environment and workspace information relevant to the user's goal. Copy the template before customization; never change the reference original.

1. Choose the extension ID, purpose, and UI/device/AI features from the request and existing preferences. Run the configure script in the copied repository. Do not ask again about choices the user has already made.
2. Identify the target workspace and instance. Keep durable data outside replaceable source. Preserve existing explicit destinations. Back up and compare old data before migration and retain a restoration path; never interpret an empty fresh store as successful migration.
3. For device ingress, use the ID-specific environment prefix printed by configure to set a distinct device token through the local secret/environment mechanism. For AI, use the parent host by default and an optional named agent. Configure a different destination only when explicitly requested. Do not print or transmit secret values.
4. Run npm ci, npm test, and npm run build in the copied repository. Inspect current instance CLI help using its supplied absolute path. Register the local manifest, start only this ID, and check status/doctor within the user's authorized scope.
5. Verify the counter survives a restart, optional UI is reachable, enabled device input authenticates correctly, and enabled AI returns a final response. Real AI/device checks require the corresponding configured environment; report mock-only coverage honestly.
6. Report actual settings, durable data scope, results, and unknowns. Treat publication, unrelated configuration, external delivery, and destructive cleanup beyond the user's request separately.

Extend this document with actual domain configuration, stable API operations, migration invariants, and verified host versions. Do not require the user to hand-edit files when the AI can perform authorized configuration and verification.
