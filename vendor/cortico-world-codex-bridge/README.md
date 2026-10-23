# Internal Codex public-session adapter

This source retains the 0.2 feature baseline, including scoped workspace-file tools, source-identity checks, bounded streaming projections and persistent notification recovery. It adds the common owner-controlled reporting gate and only forwards important native task boundaries in the aggregate.

The aggregate bundles this adapter directly. No external Codex bridge World is required. Readers operate only on explicitly configured workspaces and exclusions; all source tests create synthetic records in operating-system temporary directories. The optional native desktop control transport is separately implemented in conversation-control and remains version pinned.
