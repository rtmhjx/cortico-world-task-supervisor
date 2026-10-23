# Shared conversation control core

This internal source component implements the authenticated loopback protocol, persistent conversation router, native DSH lifecycle adapter, version-pinned Codex desktop/app-server adapter and native progress feed. Existing source identities and uncertain operation outcomes are preserved; a missing native terminal fact never proves completion.

The aggregate build bundles this source directly. It is not a separately mounted Cortico World. Native DSH integration still requires the standalone DSH gateway inside the actual DSH host. See the aggregate BUILDING.md for source tests, optional native SessionQueryEngine acceptance and configuration of real exclusions.
