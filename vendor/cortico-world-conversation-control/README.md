# Internal conversation-control adapter

Source baseline: conversation-control World 0.2.1, with the shared durable reporting gate, important-boundary notifications and stricter origin handling. The one API 6 Task Supervisor World constructs this adapter directly and supplies the owner, common gate identity and scoped gateway transport.

The legacy console declaration and assets remain source compatibility material. Only the aggregate's API 6 web UI is registered. Build and test this component through the aggregate rather than installing another copy of the old World alongside it.
