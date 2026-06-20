---
name: ax-agent-assign
description: Assign a business task to a Codex, human, or external agent role with explicit tools, permissions, prohibited actions, approval gates, and completion criteria. Use when creating an agent record, deciding who should own a workflow step, or reducing risk before automation.
---

# AX Agent Assign

1. Classify the task by risk, reversibility, data sensitivity, and external side effects.
2. Choose the smallest capable role:
   - Codex for analysis, drafts, code, local files, and reversible preparation.
   - Human for legal, financial, guest-impacting, price, refund, booking, and final approval decisions.
   - External staff for physical work with explicit instructions and confirmation.
3. Update `agents.json` and the task's `assigneeType` / `assigneeId`.
4. Define:
   - role
   - allowed tools
   - forbidden actions
   - default prompt
   - required approval gates
   - success and stop criteria
5. Never grant permission merely because a tool is available.
6. Keep formal external actions human-approved by default.
7. Report the assignment rationale and remaining risk.
