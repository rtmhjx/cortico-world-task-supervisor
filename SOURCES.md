# Source provenance

The vendor tree contains allowlisted TypeScript sources and console/prompt assets from the conversation-control, Codex bridge, DSH memory, shared task-reporting and DSH gateway components. It contains no installed host code, dependency tree, credentials or live data.

- Conversation control: https://github.com/rtmhjx/cortico-world-conversation-control (working source 0.2.1).
- Codex bridge: https://github.com/rtmhjx/cortico-world-codex-bridge (0.2 feature baseline, retaining workspace-file support).
- DSH memory: https://github.com/rtmhjx/cortico-world-dsh-memory (0.5 feature baseline plus the tool gate from the 0.4.5 compatibility candidate).
- Cortico host/SDK: https://github.com/Pal-AI-Lab/Cortico, a separate dependency.

Versions above identify source baselines, not proof of an upstream merge or a published release of this aggregate. All component imports are bundled locally; the three older Worlds need not be installed in Cortico. The DSH gateway still runs separately inside the actual DSH host.

Vendor changes include configurable exclusions, synthetic test identities, portable toolchain resolution and the DSH memory gate wrapper. Original component identifiers remain internal for source compatibility.

The optional vendor/snowluma-native add-on derives from the workbench's pure-source native bridge and synthetic native tests. Only bridge source and rewritten synthetic tests are included; its private runtime installer, configuration and installed SnowLuma runtime are excluded. The protocol is implemented by this add-on rather than claimed as a stock SnowLuma interface. Additive subscription read/add are community changes that preserve other consumers' allowlists.
