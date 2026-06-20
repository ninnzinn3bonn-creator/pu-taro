---
name: ax-runbook
description: Create or revise a safe operational runbook for a human-and-AI business workflow. Use when documenting repeatable procedures, defining approval checkpoints, clarifying failure recovery, or turning an automation blueprint into executable operating instructions.
---

# AX Runbook

1. Identify trigger, owner, inputs, outputs, frequency, and success criteria.
2. Write the runbook to `.ax-factory/runbooks/<workflow-id>.md` unless the user specifies another destination.
3. Include:
   - purpose and scope
   - prerequisites
   - ordered procedure
   - AI-permitted actions
   - human-only decisions
   - validation checklist
   - failure and rollback procedure
   - required logs and evidence
4. Require human approval for external communication, financial changes, booking changes, personal data, and irreversible operations.
5. Use explicit stop conditions. Do not say “handle errors appropriately.”
6. Link files and templates by path instead of duplicating their full content.
7. End with the next review date or event that should trigger revision.
