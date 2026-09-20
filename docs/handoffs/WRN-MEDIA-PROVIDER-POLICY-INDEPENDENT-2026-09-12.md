# Media provider-policy independent handoff

Gate `4635f456`: **PASS with binding conditions**. The exact-pair compiled v1
policy can proceed to a later implementation gate while provider activation
stays disabled.

Critical bindings: only `recipientOrigin` belongs to `allowedOrigins`; the
privacy URL origin does not expand delivery authority. Historical proof and A6
safety retention remain policy-free, while ordinary A1 and current A6
activate/read/rollback require today's detached policy. Removing a pair blocks
Ready without deleting or corrupting stored bytes.

Wire/IDB v1 may remain unchanged because the registry is compiled process
configuration and is never persisted or added to remote documents. Exact API
propagation and minimum oracles are recorded in
`docs/evidence/WRN-MEDIA-PROVIDER-POLICY-INDEPENDENT-2026-09-12.md`.

No provider, code, test, browser, index or configuration action occurred. All
rights are returned; provider activation and release gates remain open.
