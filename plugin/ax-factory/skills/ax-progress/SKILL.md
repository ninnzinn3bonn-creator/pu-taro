---
name: ax-progress
description: Update AX Factory task, session, run, approval, and business-area progress after real work is completed. Use at the end of an implementation or operational task to synchronize evidence, changed files, status, blockers, and the next action into the factory data.
---

# AX Progress

1. Find the matching task and session by stable ID. Do not create duplicates when a record already exists.
2. Record:
   - actual status
   - evidence-based progress
   - changed files
   - run result
   - blocker or approval requirement
   - next action
3. Set `completed` only when acceptance criteria were verified.
4. Set `waiting_approval` when the next step is a human decision.
5. Set `error` only with a concrete failure reason.
6. Recalculate the parent business-area progress from its tasks; do not increase it arbitrarily.
7. Preserve historical runs and approvals.
8. Validate JSON and summarize every status transition.
