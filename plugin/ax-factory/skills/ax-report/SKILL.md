---
name: ax-report
description: Generate an evidence-based AX Factory progress report from business areas, tasks, sessions, runs, approvals, and changed files. Use for weekly or monthly reviews, identifying automation bottlenecks, summarizing Codex work, or selecting the next highest-value AX action.
---

# AX Report

1. Read AX Factory JSON and relevant recent artifacts.
2. Distinguish completed work, active work, approval waits, errors, and unverified claims.
3. Write `.ax-factory/reports/YYYY-MM-DD-ax-report.md` unless another path is requested.
4. Include:
   - executive summary
   - progress by business area
   - completed automation improvements
   - active Codex sessions and changed files
   - pending approvals with risk level
   - errors and root causes
   - next three actions ordered by value and dependency
5. Use percentages only when supported by task-level evidence.
6. Call out stale data and missing logs.
7. Do not treat visual polish, plans, or generated drafts as operational completion.
