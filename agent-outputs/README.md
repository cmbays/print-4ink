# Agent Outputs

Structured output from agent runs. This directory provides an audit trail of what each agent produced per step.

## Structure

```text
agent-outputs/
  step-01/                    # Step 1 outputs
    frontend-builder-output.md
    quality-gate-report.md
  step-02/
    frontend-builder-output.md
    quality-gate-report.md
  checkpoint-1/               # Milestone checkpoint outputs
    design-audit-report.md
  doc-sync-YYYY-MM-DD.md      # Doc sync reports (dated)
```

## Purpose

- **Audit trail**: Track what each agent produced at each step
- **Debugging**: When something goes wrong, trace back to agent output
- **Learning**: Review agent outputs to improve prompts and workflows
- **Handoff**: Pass structured output from one agent to the next

## Conventions

- Files are named `[agent-name]-output.md` or `[agent-name]-report.md`
- Step directories match IMPLEMENTATION_PLAN step numbers
- Checkpoint directories use `checkpoint-N` naming
- Date-stamped files use `YYYY-MM-DD` format
- All files are markdown with structured headers
