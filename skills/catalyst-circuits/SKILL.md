---
name: catalyst-circuits
description: "Catalyst Circuits — build and debug workflows that orchestrate Basic I/O functions with branches, parallel paths, batches, and retries. Use for 'create a circuit', 'workflow failed', 'missing circuit output', circuit.execute, circuit.status, circuit.abort, execution history, JSON paths, or circuit compilation errors."
metadata:
  version: "2.0.0"
---

## How It Works

1. **Identify the workflow** — Establish the project, data center, environment, function types, and expected input/output. Default to Development; check Circuits availability before designing resources.
2. **Load the reference** — Read `references/circuits-basics.md` for state selection, console configuration, and execution diagnosis. Load the linked SDK initialization reference only when writing an SDK caller.
3. **Preserve Catalyst contracts** — Use Basic I/O function targets and Catalyst's state configuration. Check JSON paths against actual payloads, distinguish circuit IDs from reference names, and bound retries for operations with side effects.
4. **Configure or execute** — Preserve the existing graph and use the console's compilation check. Use the documented SDK signature for the installed version. For available MCP tools, inspect their schema before calling them.
5. **Follow the execution** — Record the execution ID and inspect its final status, traversed states, and output. Diagnose the first failing state before retrying; an accepted or running execution is not a completed workflow. State which live checks remain unperformed.

## Triggers

Use this skill for: "Circuits", "create a circuit", "orchestrate functions", "workflow failed", "missing circuit output", "circuit compilation errors", "nested circuit", "parallel paths", "batch state", "retry and fallback", "execution history", "JSON paths", `circuit.execute`, `circuit.status`, or `circuit.abort`.

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/circuits-basics.md` | Availability, state design, data paths, SDK execution/status/abort, and failed executions |
