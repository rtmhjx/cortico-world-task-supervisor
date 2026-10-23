# Internal DSH external-memory and workspace adapter

This source retains the 0.5 feature baseline: explicit workspace binding, exclusions, public raw-message projection, bounded zstd frame decoding, persistent runtime and optional external-memory write queue. The reporting tool wrapper is ported from the 0.4.5 compatibility candidate without dropping workspace-mode features.

The aggregate binds all model tools to the common owner-controlled gate and forces native memory watch deliveries to local record mode. The published worker is built as lib/dsh-memory-raw-worker.mjs; the packaging test runs it without a TypeScript loader. Source-file workers remain available for development tests.

This adapter is bundled directly and does not require another mounted DSH memory World. Source data remains external evidence; configuration controls permitted projects, workspace roots, exclusions and optional writes. Source tests do not open an installed profile or a real session archive.
